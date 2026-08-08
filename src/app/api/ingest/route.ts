import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseLive, supabaseServer } from '@/lib/supabaseServer';
import { transcribeWithSarvam } from '@/lib/algorithms/sarvamClient';
import { analyzeCallWithGemini } from '@/lib/algorithms/geminiScoring';
import { callsStore } from '@/lib/callsStore';

export const dynamic = 'force-dynamic';
// Server-side timeout — Vercel Pro allows up to 300s, Hobby 60s
export const maxDuration = 60;

/**
 * POST /api/ingest
 *
 * Accepts two modes:
 *   A) JSON body: { storage_path, leadName, city, execName, language }
 *      → file was already uploaded to Supabase Storage by the browser
 *   B) FormData body: { file, leadName, city, execName, language }
 *      → legacy direct upload (< 4 MB only on Vercel Hobby)
 */
export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer;
    let fileName: string;
    let leadName = 'Prospect Lead';
    let city = 'Chennai';
    let execName = 'Karthik Raja';
    let language: 'Tamil' | 'Tanglish' | 'English' = 'Tanglish';
    let contentType = 'audio/wav';
    let audioUrl = '';
    let uploadedStoragePath: string | null = null;

    // ── Mode A: JSON body with storage_path ──────────────────────────────────
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await req.json();
      const storagePath: string = body.storage_path;
      uploadedStoragePath = storagePath;
      leadName   = body.leadName   || leadName;
      city       = body.city       || city;
      execName   = body.execName   || execName;
      language   = body.language   || language;
      fileName   = storagePath.split('/').pop() || 'audio.mp3';

      if (!storagePath) {
        return NextResponse.json({ error: 'storage_path is required' }, { status: 400 });
      }

      if (!isSupabaseLive()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
      }

      // Download file from Supabase Storage (server-side, no size limit)
      const { data: dlData, error: dlErr } = await supabaseServer.storage
        .from('call-recordings')
        .download(storagePath);

      if (dlErr || !dlData) {
        return NextResponse.json(
          { error: `Could not download from storage: ${dlErr?.message}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await dlData.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = dlData.type || 'audio/mpeg';

      // Build the public URL
      const { data: urlData } = supabaseServer.storage
        .from('call-recordings')
        .getPublicUrl(storagePath);
      audioUrl = urlData.publicUrl;

    // ── Mode B: FormData (legacy / small files) ──────────────────────────────
    } else {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      leadName = (formData.get('leadName') as string) || leadName;
      city     = (formData.get('city')     as string) || city;
      execName = (formData.get('execName') as string) || execName;
      language = ((formData.get('language') as string) || language) as typeof language;

      if (!file) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = file.name;
      contentType = file.type || 'audio/wav';

      if (contentType === 'video/mp4' || fileName.toLowerCase().endsWith('.mp4')) {
        contentType = 'audio/mp4';
      } else if (contentType === 'audio/m4a' || fileName.toLowerCase().endsWith('.m4a')) {
        contentType = 'audio/x-m4a';
      }

      const storageFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      // Upload to Supabase Storage if live
      if (isSupabaseLive()) {
        try {
          const { data: storageData, error: storageErr } = await supabaseServer.storage
            .from('call-recordings')
            .upload(storageFileName, buffer, { contentType, upsert: true });

          if (!storageErr && storageData) {
            const { data: publicUrlData } = supabaseServer.storage
              .from('call-recordings')
              .getPublicUrl(storageFileName);
            audioUrl = publicUrlData.publicUrl;
          }
        } catch (sErr) {
          console.warn('[Supabase Storage] Upload notice:', sErr);
        }
      }

      if (!audioUrl) {
        if (buffer.length < 10 * 1024 * 1024) {
          audioUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
        } else {
          audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        }
      }
    }

    // ── Shared: executive lookup / insert ────────────────────────────────────
    let executiveId: string | null = null;
    if (isSupabaseLive()) {
      try {
        const { data: execData } = await supabaseServer
          .from('executives')
          .select('id')
          .eq('name', execName)
          .single();

        if (execData) {
          executiveId = execData.id;
        } else {
          const newExecId = crypto.randomUUID();
          const { data: newExec, error: execErr } = await supabaseServer
            .from('executives')
            .insert([{ id: newExecId, name: execName, team_id: crypto.randomUUID() }])
            .select('id')
            .single();
          executiveId = (newExec && !execErr) ? newExec.id : newExecId;
        }
      } catch (eErr) {
        console.warn('[Executives DB] Exec check fallback:', eErr);
      }
    }

    const durationSeconds = Math.max(60, Math.round(buffer.length / (1024 * 30)));
    let callId = crypto.randomUUID();

    if (isSupabaseLive()) {
      try {
        const { data: callData, error: callErr } = await supabaseServer
          .from('calls')
          .insert([{
            id: callId,
            executive_id: executiveId,
            lead_name: leadName,
            city,
            audio_url: audioUrl,
            duration: durationSeconds,
            telephony_source: 'manual_upload',
            language,
            processing_status: 'transcribing',
            recorded_at: new Date().toISOString(),
          }])
          .select('id')
          .single();

        if (callData && !callErr) {
          callId = callData.id;
        } else if (callErr) {
          console.warn('[Calls DB Insert Error]:', callErr);
        }
      } catch (err) {
        console.warn('[Calls DB] Direct insert warning:', err);
      }
    }

    // ── STT: Sarvam AI diarization ───────────────────────────────────────────
    const sttResult = await transcribeWithSarvam(buffer, fileName!);

    if (isSupabaseLive()) {
      try {
        const { error: tErr } = await supabaseServer.from('transcripts').insert([{
          id: crypto.randomUUID(),
          call_id: callId,
          segments: sttResult.segments,
          word_error_rate: sttResult.werEstimate,
          stt_confidence: sttResult.confidence,
        }]);
        if (tErr) console.warn('[Transcripts DB Insert Error]:', tErr);
      } catch (tErr) {
        console.warn('[Transcripts DB] Warning:', tErr);
      }
    }

    // ── Gemini rubric scoring ─────────────────────────────────────────────────
    const scoringResult = await analyzeCallWithGemini(sttResult.segments, leadName, city);
    scoringResult.analysis.call_id = callId;

    let analysisId = scoringResult.analysis.id;
    if (isSupabaseLive()) {
      try {
        const { data: analysisData, error: aInsertErr } = await supabaseServer
          .from('analyses')
          .insert([{
            id: analysisId,
            call_id: callId,
            overall_score: scoringResult.analysis.overall_score,
            sub_scores: scoringResult.analysis.sub_scores,
            penalties: scoringResult.analysis.penalties,
            total_deductions: scoringResult.analysis.total_deductions,
            confidence_level: scoringResult.analysis.confidence_level,
            summary_text: scoringResult.analysis.summary_text,
            model_version: scoringResult.analysis.model_version,
            rubric_version: scoringResult.analysis.rubric_version,
          }])
          .select('id')
          .single();

        if (analysisData && !aInsertErr) analysisId = analysisData.id;
        else if (aInsertErr) console.warn('[Analyses DB Insert Error]:', aInsertErr);

        if (scoringResult.insights.length > 0) {
          const { error: insErr } = await supabaseServer.from('insights').insert(
            scoringResult.insights.map((ins) => ({
              id: crypto.randomUUID(),
              analysis_id: analysisId,
              type: ins.type,
              title: ins.title,
              text: ins.text,
              what_was_wrong: ins.what_was_wrong || null,
              why_was_wrong: ins.why_was_wrong || null,
              how_to_say_instead: ins.how_to_say_instead || null,
              why_say_that: ins.why_say_that || null,
              expected_impact: ins.expected_impact || null,
              quote: ins.quote,
              timestamp_ref: ins.timestamp_ref,
            }))
          );
          if (insErr) console.warn('[Insights DB Insert Error]:', insErr);
        }

        await supabaseServer
          .from('calls')
          .update({ processing_status: 'completed' })
          .eq('id', callId);
      } catch (aErr) {
        console.warn('[Analyses DB] Warning:', aErr);
      }
    }

    const ingestedCall = {
      id: callId,
      lead_name: leadName,
      city,
      audio_url: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: durationSeconds,
      language,
      recorded_at: new Date().toISOString(),
      processing_status: 'completed',
      executives: { name: execName },
      analyses: [{
        id: analysisId,
        overall_score: scoringResult.analysis.overall_score,
        sub_scores: scoringResult.analysis.sub_scores,
        penalties: scoringResult.analysis.penalties,
        total_deductions: scoringResult.analysis.total_deductions,
        summary_text: scoringResult.analysis.summary_text,
        insights: scoringResult.insights,
      }],
      transcripts: [{
        segments: sttResult.segments,
        stt_confidence: sttResult.confidence,
      }],
    };

    callsStore.addCall(ingestedCall);

    // Auto-cleanup audio file from Supabase Storage after transcription & scoring complete
    if (uploadedStoragePath) {
      try {
        await supabaseServer.storage.from('call-recordings').remove([uploadedStoragePath]);
        console.log(`[Storage Auto-Cleanup] Successfully deleted audio file from storage: ${uploadedStoragePath}`);
      } catch (cleanErr) {
        console.warn('[Storage Auto-Cleanup Notice]:', cleanErr);
      }
    }

    return NextResponse.json({ success: true, callId, call: ingestedCall });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingestion failed';
    console.error('[Ingest API Error]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
