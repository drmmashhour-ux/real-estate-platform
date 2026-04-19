/**
 * Conservative thresholds for evidence-based expansion — tune via env.
 */

export function expansionMinSampleSize(): number {
  const raw = process.env.GROWTH_AUTONOMY_EXPANSION_MIN_SAMPLE;
  if (!raw) return 24;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 8 ? Math.min(500, n) : 24;
}

export function expansionMaxUndoRate(): number {
  const raw = process.env.GROWTH_AUTONOMY_EXPANSION_MAX_UNDO_RATE;
  if (!raw) return 0.22;
  const x = Number.parseFloat(raw);
  return Number.isFinite(x) ? Math.min(0.6, Math.max(0.05, x)) : 0.22;
}

export function expansionMinPositiveFeedbackRatio(): number {
  const raw = process.env.GROWTH_AUTONOMY_EXPANSION_MIN_POS_FEEDBACK;
  if (!raw) return 0.52;
  const x = Number.parseFloat(raw);
  return Number.isFinite(x) ? Math.min(0.95, Math.max(0.35, x)) : 0.52;
}

export function expansionEvidenceWindowDays(): number {
  const raw = process.env.GROWTH_AUTONOMY_EXPANSION_WINDOW_DAYS;
  if (!raw) return 42;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 7 ? Math.min(365, n) : 42;
}
