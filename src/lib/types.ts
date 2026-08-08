export interface Executive {
  id: string;
  name: string;
  team_id: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Call {
  id: string;
  executive_id?: string;
  lead_name: string;
  city: string;
  audio_url: string;
  duration: number; // in seconds
  telephony_source: string;
  language: 'Tamil' | 'Tanglish' | 'English';
  recorded_at: string;
  processing_status: 'queued' | 'preprocessing' | 'transcribing' | 'evaluating' | 'completed' | 'failed';
  consent_verified: boolean;
  created_at?: string;
  executives?: Executive;
}

export interface TranscriptSegment {
  speaker: 'Agent' | 'Customer';
  start_time: string;
  end_time?: string;
  text: string;
  eng_switched?: string;
  confidence?: number;
}

export interface Transcript {
  id: string;
  call_id: string;
  segments: TranscriptSegment[];
  word_error_rate: number;
  stt_confidence: number;
}

export interface CategorySubScores {
  opening: number;   // Max 15
  discovery: number; // Max 20
  pitch_clarity: number; // Max 20
  objection_handling: number; // Max 20
  closing: number;   // Max 15
  talk_listen: number; // Max 10
}

export interface SubScoreReason {
  score: number;
  max: number;
  reason: string;         // WHY this score was given
  quote?: string;         // Verbatim call quote supporting the reasoning
  timestamp?: string;
}

export interface SubScoreReasons {
  opening?: SubScoreReason;
  discovery?: SubScoreReason;
  pitch_clarity?: SubScoreReason;
  objection_handling?: SubScoreReason;
  closing?: SubScoreReason;
  talk_listen?: SubScoreReason;
}

export interface WeakArea {
  label: string;        // e.g. "Needs Discovery"
  pct: number;          // percentage of max, e.g. 55
  reason: string;       // what went wrong
  quote?: string;
  timestamp?: string;
}

export interface PenaltyDeduction {
  violation: string;
  deduction: number;
  severity: 'Critical' | 'Moderate' | 'Minor';
  timestamp?: string;
  quote?: string;
}

export interface Analysis {
  id: string;
  call_id: string;
  overall_score: number; // 0-100
  sub_scores: CategorySubScores;
  sub_score_reasons?: SubScoreReasons;
  weak_areas?: WeakArea[];
  penalties: PenaltyDeduction[];
  total_deductions: number;
  confidence_level: number;
  summary_text: string;
  model_version: string;
  rubric_version: string;
}

export interface Insight {
  id: string;
  analysis_id: string;
  type: 'positive' | 'negative' | 'improvement';
  title: string;
  text: string;
  quote?: string;
  timestamp_ref?: string;
  linked_negative_id?: string;
}

export interface ManagerOverride {
  id: string;
  analysis_id: string;
  manager_id: string;
  original_score: number;
  corrected_score: number;
  reason: string;
  created_at?: string;
}
