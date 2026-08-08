import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseLive, supabaseServer } from '@/lib/supabaseServer';
import { transcribeWithSarvam } from '@/lib/algorithms/sarvamClient';
import { analyzeCallWithGemini } from '@/lib/algorithms/geminiScoring';
import { callsStore } from '@/lib/callsStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const leadName = (formData.get('leadName') as string) || 'Prospect Lead';
    const city = (formData.get('city') as string) || 'Chennai';
    const execName = (formData.get('execName') as string) || 'Karthik Raja';
    const language = ((formData.get('language') as string) || 'Tanglish') as 'Tamil' | 'Tanglish' | 'English';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let audioUrl = '';
    let contentType = file.type || 'audio/wav';
    if (contentType === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')) {
      contentType = 'audio/mp4';
    } else if (contentType === 'audio/m4a' || file.name.toLowerCase().endsWith('.m4a')) {
      contentType = 'audio/x-m4a';
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // 1. Upload to Supabase Storage Bucket 'call-recordings' if live
    if (isSupabaseLive()) {
      try {
        const { data: storageData, error: storageErr } = await supabaseServer.storage
          .from('call-recordings')
          .upload(fileName, buffer, { contentType, upsert: true });

        if (!storageErr && storageData) {
          const { data: publicUrlData } = supabaseServer.storage
            .from('call-recordings')
            .getPublicUrl(fileName);
          audioUrl = publicUrlData.publicUrl;
        }
      } catch (sErr) {
        console.warn('[Supabase Storage] Bucket notice:', sErr);
      }
    }

    if (!audioUrl) {
      if (buffer.length < 10 * 1024 * 1024) {
        audioUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
      } else {
        audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      }
    }

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
          if (newExec && !execErr) executiveId = newExec.id;
          else executiveId = newExecId;
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
          .insert([
            {
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
            },
          ])
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

    // 4. Algorithm Step 1: Sarvam AI & Gemini STT & Diarization for uploaded audio
    const sttResult = await transcribeWithSarvam(buffer, file.name);

    if (isSupabaseLive()) {
      try {
        const { error: tErr } = await supabaseServer.from('transcripts').insert([
          {
            id: crypto.randomUUID(),
            call_id: callId,
            segments: sttResult.segments,
            word_error_rate: sttResult.werEstimate,
            stt_confidence: sttResult.confidence,
          },
        ]);
        if (tErr) console.warn('[Transcripts DB Insert Error]:', tErr);
      } catch (tErr) {
        console.warn('[Transcripts DB] Warning:', tErr);
      }
    }

    // 5. Algorithm Step 2: Gemini Reasoning & 0-100 Rubric Scoring
    const scoringResult = await analyzeCallWithGemini(sttResult.segments, leadName, city);
    scoringResult.analysis.call_id = callId;

    let analysisId = scoringResult.analysis.id;
    if (isSupabaseLive()) {
      try {
        const { data: analysisData, error: aInsertErr } = await supabaseServer
          .from('analyses')
          .insert([
            {
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
            },
          ])
          .select('id')
          .single();

        if (analysisData && !aInsertErr) analysisId = analysisData.id;
        else if (aInsertErr) console.warn('[Analyses DB Insert Error]:', aInsertErr);

        if (scoringResult.insights.length > 0) {
          const insightsToInsert = scoringResult.insights.map((ins) => ({
            id: crypto.randomUUID(),
            analysis_id: analysisId,
            type: ins.type,
            title: ins.title,
            text: ins.text,
            quote: ins.quote,
            timestamp_ref: ins.timestamp_ref,
          }));
          const { error: insErr } = await supabaseServer.from('insights').insert(insightsToInsert);
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
      analyses: [
        {
          id: analysisId,
          overall_score: scoringResult.analysis.overall_score,
          sub_scores: scoringResult.analysis.sub_scores,
          penalties: scoringResult.analysis.penalties,
          total_deductions: scoringResult.analysis.total_deductions,
          summary_text: scoringResult.analysis.summary_text,
          insights: scoringResult.insights,
        },
      ],
      transcripts: [
        {
          segments: sttResult.segments,
          stt_confidence: sttResult.confidence,
        },
      ],
    };

    callsStore.addCall(ingestedCall);

    return NextResponse.json({
      success: true,
      callId,
      call: ingestedCall,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingestion failed';
    console.error('[Ingest API Error]:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
