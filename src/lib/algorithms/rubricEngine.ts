import { CategorySubScores, PenaltyDeduction } from '../types';

/**
 * Calculates overall score purely from rubric sub-scores (0-100 max sum).
 * Negative deduction marking has been removed as requested.
 */
export function calculateOverallScore(
  subScores: CategorySubScores,
  _penalties?: PenaltyDeduction[]
): { overallScore: number; totalDeductions: number; weightedSum: number } {
  // Category sub-score weighted sum (Max 100)
  const weightedSum =
    (subScores.opening || 0) +
    (subScores.discovery || 0) +
    (subScores.pitch_clarity || 0) +
    (subScores.objection_handling || 0) +
    (subScores.closing || 0) +
    (subScores.talk_listen || 0);

  // Negative marking removed — totalDeductions is always 0
  const totalDeductions = 0;
  const overallScore = Math.max(0, Math.min(100, Math.round(weightedSum)));

  return {
    overallScore,
    totalDeductions: 0,
    weightedSum,
  };
}

export function getScoreBand(score: number): {
  band: 'excellent' | 'good' | 'coaching' | 'critical';
  label: string;
  badgeClass: string;
} {
  if (score >= 85) {
    return { band: 'excellent', label: 'Excellent (A+)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  } else if (score >= 70) {
    return { band: 'good', label: 'Good (B)', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' };
  } else if (score >= 50) {
    return { band: 'coaching', label: 'Needs Coaching (C)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
  } else {
    return { band: 'critical', label: 'Critical Gap (D)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}
