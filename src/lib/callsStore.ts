import { CategorySubScores, Insight, PenaltyDeduction, TranscriptSegment } from './types';

export interface IngestedCall {
  id: string;
  lead_name: string;
  city: string;
  audio_url: string;
  duration: number;
  language: string;
  recorded_at: string;
  processing_status: string;
  executives?: { name: string; avatar_url?: string };
  analyses?: Array<{
    id: string;
    overall_score: number;
    sub_scores: CategorySubScores | Record<string, number>;
    penalties: PenaltyDeduction[] | Array<{
      violation: string;
      deduction: number;
      severity: string;
      timestamp?: string;
    }>;
    total_deductions?: number;
    summary_text: string;
    insights?: Insight[] | Array<{
      id?: string;
      type: 'positive' | 'negative' | 'improvement';
      title: string;
      text: string;
      quote?: string;
      timestamp_ref?: string;
    }>;
  }>;
  transcripts?: Array<{
    segments: TranscriptSegment[] | Array<{
      speaker: 'Agent' | 'Customer';
      start_time: string;
      text: string;
      eng_switched?: string;
    }>;
    stt_confidence: number;
  }>;
}

const initialSampleCalls: IngestedCall[] = [
  {
    id: 'call-sample-1',
    lead_name: 'Ramesh (Real Estate Prospect)',
    city: 'Chennai',
    duration: 250,
    language: 'Tanglish',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    recorded_at: new Date().toISOString(),
    processing_status: 'completed',
    executives: { name: 'Karthik Raja' },
    analyses: [
      {
        id: 'analysis-sample-1',
        overall_score: 88,
        sub_scores: {
          opening: 14,
          discovery: 18,
          pitch_clarity: 19,
          objection_handling: 16,
          closing: 13,
          talk_listen: 8,
        },
        penalties: [
          {
            violation: 'Interrupted customer during price query',
            deduction: 5,
            severity: 'Moderate',
            timestamp: '01:45',
          },
        ],
        total_deductions: 5,
        summary_text: 'Executive engaged prospect Ramesh in Tamil/Tanglish. Highlighted Zero-Cost EMI facility smoothly.',
        insights: [
          {
            id: 'ins-1',
            type: 'positive',
            title: 'Tanglish Offer Explanation',
            text: 'Explained 3-Months Free API Integration offer in natural code-switched Tamil.',
            quote: 'Sir, 3-months zero cost EMI facility irukku, ungalukku flexible ah irukkum.',
            timestamp_ref: '00:30',
          },
          {
            id: 'ins-2',
            type: 'improvement',
            title: 'Explicit WhatsApp Follow-up Commit',
            text: 'Suggest asking customer for precise follow-up time slot in Tamil.',
            quote: 'Naan brochure unga WhatsApp kku anuppurean sir, நாளைக்கு மாலை 5 மணிக்கு Call பண்ணட்டுமா?',
            timestamp_ref: '02:30',
          },
        ],
      },
    ],
    transcripts: [
      {
        stt_confidence: 97.2,
        segments: [
          {
            speaker: 'Agent',
            start_time: '00:04',
            text: 'வணக்கம் சார்! நான் Virpo Sales Team லிருந்து பேசுறேன். எப்படி இருக்கீங்க?',
            eng_switched: 'Virpo Sales Team',
          },
          {
            speaker: 'Customer',
            start_time: '00:15',
            text: 'வணக்கம், நல்லா இருக்கேன். சொல்லுங்க, அந்த SaaS Renewal offer பத்தி கேட்கலாம்னு நினைச்சேன்.',
            eng_switched: 'SaaS Renewal offer',
          },
          {
            speaker: 'Agent',
            start_time: '00:30',
            text: 'நிச்சயமாக சார்! நம்ம கிட்ட இப்போ 3-Months Free API Integration offer போயிட்டு இருக்கு.',
            eng_switched: '3-Months Free API Integration offer',
          },
          {
            speaker: 'Customer',
            start_time: '01:45',
            text: 'பீஸ் கொஞ்சம் அதிகமா இருக்கே, Discount ஏதும் கிடைக்குமா?',
            eng_switched: 'Discount',
          },
          {
            speaker: 'Agent',
            start_time: '02:10',
            text: 'புரியுது சார். ஆனால் Zero-Cost EMI option இருக்கு, மாதாந்திர தவணையா சுலபமா செலுத்தலாம்.',
            eng_switched: 'Zero-Cost EMI option',
          },
          {
            speaker: 'Agent',
            start_time: '03:45',
            text: 'நாளைக்கு மாலை 5 மணிக்கு WhatsApp ல Details அனுப்பிட்டு Call பண்ணட்டுமா சார்?',
            eng_switched: 'WhatsApp Details Call',
          },
        ],
      },
    ],
  },
];

class CallsStore {
  private calls: IngestedCall[] = [...initialSampleCalls];

  getCalls(): IngestedCall[] {
    return this.calls;
  }

  addCall(call: IngestedCall): void {
    this.calls = [call, ...this.calls.filter((c) => c.id !== call.id)];
  }
}

export const callsStore = new CallsStore();
