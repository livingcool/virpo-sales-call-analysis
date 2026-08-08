import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { analysisId, managerId, originalScore, correctedScore, reason } = body;

    if (!analysisId || correctedScore === undefined) {
      return NextResponse.json({ error: 'Missing analysisId or correctedScore' }, { status: 400 });
    }

    // 1. Insert into manager_overrides table
    const { data: overrideData, error: overrideErr } = await supabaseServer
      .from('manager_overrides')
      .insert([
        {
          analysis_id: analysisId,
          manager_id: managerId || 'manager-1',
          original_score: originalScore || 0,
          corrected_score: parseInt(correctedScore, 10),
          reason: reason || 'Manager score recalibration',
        },
      ])
      .select('id')
      .single();

    if (overrideErr) {
      console.warn('[Manager Override DB] Insert warning:', overrideErr);
    }

    // 2. Update overall_score in analyses table
    const { error: updateErr } = await supabaseServer
      .from('analyses')
      .update({ overall_score: parseInt(correctedScore, 10) })
      .eq('id', analysisId);

    if (updateErr) {
      console.warn('[Analyses Score Update] Warning:', updateErr);
    }

    return NextResponse.json({
      success: true,
      overrideId: overrideData?.id || 'ovr-' + Date.now(),
      newScore: parseInt(correctedScore, 10),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Override failed';
    console.error('[Override API Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
