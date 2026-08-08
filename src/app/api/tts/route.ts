import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiTTSAudio } from '@/lib/algorithms/geminiTTS';
import { TranscriptSegment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const segments: TranscriptSegment[] = body.segments || [];
    const agentVoice = body.agentVoice || 'Kore';
    const customerVoice = body.customerVoice || 'Puck';

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: 'No transcript segments provided' }, { status: 400 });
    }

    const ttsResult = await generateGeminiTTSAudio(segments, agentVoice, customerVoice);

    return NextResponse.json({
      success: ttsResult.success,
      modelUsed: ttsResult.modelUsed,
      audioUrl: ttsResult.audioUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'TTS generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
