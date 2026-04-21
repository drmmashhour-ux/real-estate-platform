import type { DealOutcomeSlice, ExtractedLearningPattern } from "@/modules/learning/learning.types";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Bucket-level comparisons on historical outcomes — emits human-readable patterns + confidence from sample size.
 */
export function extractPatternsFromDealOutcomes(rows: DealOutcomeSlice[]): ExtractedLearningPattern[] {
  const closed = rows.filter((r) => r.outcome === "CLOSED");
  if (closed.length < 8) return [];

  const patterns: ExtractedLearningPattern[] = [];

  const discount = closed.filter((r) => r.priceDelta <= -0.03);
  const nonDiscount = closed.filter((r) => r.priceDelta > -0.03);

  if (discount.length >= 4 && nonDiscount.length >= 4) {
    const md = mean(discount.map((x) => x.durationDays));
    const mo = mean(nonDiscount.map((x) => x.durationDays));
    const diff = mo - md;
    if (Math.abs(diff) >= 2) {
      const sampleSize = discount.length + nonDiscount.length;
      patterns.push({
        pattern: `Deals at least ~3% below reference list averaged ${Math.round(md)}d to close vs ${Math.round(
          mo,
        )}d for milder deltas (n=${sampleSize}). Descriptive only.`,
        confidence: clamp01(0.35 + Math.min(sampleSize, 120) * 0.004),
        impactScore: Math.round(Math.min(100, Math.abs(diff) * 5 + sampleSize * 0.15) * 100) / 100,
        sampleSize,
      });
    }
  }

  const sortedDur = [...closed.map((r) => r.durationDays)].sort((a, b) => a - b);
  const medianDur = sortedDur[Math.floor(sortedDur.length / 2)] ?? 0;
  const fast = closed.filter((r) => r.durationDays <= medianDur);
  const slow = closed.filter((r) => r.durationDays > medianDur);

  if (fast.length >= 5 && slow.length >= 5) {
    const mf = mean(fast.map((r) => r.priceDelta));
    const ms = mean(slow.map((r) => r.priceDelta));
    if (Math.abs(mf - ms) > 0.015) {
      const sampleSize = fast.length + slow.length;
      patterns.push({
        pattern: `Faster closes (≤ ${medianDur}d in this slice) carried different avg. price deltas vs slower closes (${(mf * 100).toFixed(
          1,
        )}% vs ${(ms * 100).toFixed(1)}%, n=${sampleSize}).`,
        confidence: clamp01(0.4 + Math.min(sampleSize, 100) * 0.003),
        impactScore:
          Math.round(Math.min(100, Math.abs(mf - ms) * 220 + sampleSize * 0.18) * 100) / 100,
        sampleSize,
      });
    }
  }

  const failed = rows.filter((r) => r.outcome === "FAILED").length;
  const failRate = rows.length > 0 ? failed / rows.length : 0;
  if (rows.length >= 10 && failRate >= 0.1 && failRate <= 0.9) {
    patterns.push({
      pattern: `Observed terminal failure share ~${(failRate * 100).toFixed(
        0,
      )}% across recorded outcomes — funnel hygiene signal (n=${rows.length}).`,
      confidence: clamp01(0.42 + rows.length * 0.002),
      impactScore: Math.round(Math.min(100, failRate * 70 + rows.length * 0.12) * 100) / 100,
      sampleSize: rows.length,
    });
  }

  return patterns;
}
