import { CategorySubScores, PenaltyDeduction } from '../types';

export function calculateOverallScore(
  subScores: CategorySubScores,
  penalties: PenaltyDeduction[]
): { overallScore: number; totalDeductions: number; weightedSum: number } {
  // Category sub-score weighted sum (Max 100)
  const weightedSum =
    (subScores.opening || 0) +
    (subScores.discovery || 0) +
    (subScores.pitch_clarity || 0) +
    (subScores.objection_handling || 0) +
    (subScores.closing || 0) +
    (subScores.talk_listen || 0);

  // Sum of penalty deductions
  const totalDeductions = penalties.reduce((acc, p) => acc + (p.deduction || 0), 0);

  // PRD Formula: overall_score = clamp(weighted_sum - sum(penalty_deductions), 0, 100)
  const rawScore = weightedSum - totalDeductions;
  const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    overallScore,
    totalDeductions,
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
    return { band: 'critical', label: 'Critical Violation (D-)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}
