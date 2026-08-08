import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { callsStore } from '@/lib/callsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch calls from Supabase with full insights breakdown fields
    const fetchPromise = supabaseServer
      .from('calls')
      .select(`
        id,
        lead_name,
        city,
        audio_url,
        duration,
        telephony_source,
        language,
        recorded_at,
        processing_status,
        executives (
          id,
          name,
          team_id,
          avatar_url
        ),
        analyses (
          id,
          overall_score,
          sub_scores,
          penalties,
          total_deductions,
          confidence_level,
          summary_text,
          model_version,
          rubric_version,
          insights (
            id,
            type,
            title,
            text,
            what_was_wrong,
            why_was_wrong,
            how_to_say_instead,
            why_say_that,
            expected_impact,
            quote,
            timestamp_ref
          )
        ),
        transcripts (
          id,
          segments,
          word_error_rate,
          stt_confidence
        )
      `)
      .order('recorded_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Supabase timeout') }), 2500)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return NextResponse.json({ calls: result.data });
    }
  } catch (err: unknown) {
    console.warn('[Calls GET API Notice]: Supabase query warning, using in-memory store:', err);
  }

  // Instant fallback to in-memory call store
  return NextResponse.json({ calls: callsStore.getCalls() });
}
