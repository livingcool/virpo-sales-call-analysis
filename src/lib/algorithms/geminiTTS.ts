import { TranscriptSegment } from '../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export interface GeminiTTSResult {
  audioUrl: string;
  success: boolean;
  modelUsed: string;
}

/**
 * Generates Multi-Speaker Text-to-Speech (TTS) Audio using Gemini Interactions API (gemini-3.1-flash-tts-preview)
 */
export async function generateGeminiTTSAudio(
  segments: TranscriptSegment[],
  agentVoice: string = 'Kore',
  customerVoice: string = 'Puck'
): Promise<GeminiTTSResult> {
  if (!GEMINI_API_KEY) {
    return {
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      success: false,
      modelUsed: 'none',
    };
  }

  // Format conversation input for Joe/Jane -> Agent/Customer dialogue
  const conversationLines = segments
    .map((seg) => `${seg.speaker === 'Agent' ? 'Agent' : 'Customer'}: ${seg.text}`)
    .join(' ');

  const promptInput = `TTS the following conversation between Agent and Customer: ${conversationLines}`;

  const candidateModels = [
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-tts',
    'gemini-2.5-flash',
  ];

  for (const modelName of candidateModels) {
    try {
      const payload = {
        model: modelName,
        input: promptInput,
        response_format: {
          type: 'audio',
        },
        generation_config: {
          speech_config: [
            { speaker: 'Agent', voice: agentVoice },
            { speaker: 'Customer', voice: customerVoice },
          ],
        },
      };

      const res = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        console.log(`[Gemini TTS API] Successfully generated multi-speaker audio with ${modelName}`);

        // Extract base64 audio content or binary stream
        const base64Audio =
          json.audio_content ||
          json.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data ||
          json.output?.audio;

        if (base64Audio) {
          return {
            audioUrl: `data:audio/mp3;base64,${base64Audio}`,
            success: true,
            modelUsed: modelName,
          };
        }
      } else {
        const errText = await res.text();
        console.warn(`[Gemini TTS API Notice] Model ${modelName} returned status ${res.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`[Gemini TTS API Error] Error invoking ${modelName}:`, err);
    }
  }

  return {
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    success: false,
    modelUsed: 'fallback',
  };
}
