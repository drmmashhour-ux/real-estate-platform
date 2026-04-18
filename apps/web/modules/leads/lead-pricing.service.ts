/**
 * Advisory suggested unlock price (CAD whole dollars) from quality band — V1 does not override Stripe/revenue engine.
 * Distinct from `modules/revenue/lead-pricing.service.ts` (CRM value + revenue bounds).
 */

import type { LeadQualityBand, LeadQualitySummary } from "./lead-quality.types";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function bandScoreRange(band: LeadQualityBand): { lo: number; hi: number } {
  switch (band) {
    case "low":
      return { lo: 0, hi: 44 };
    case "medium":
      return { lo: 45, hi: 71 };
    case "high":
      return { lo: 72, hi: 87 };
    case "premium":
      return { lo: 88, hi: 100 };
    default:
      return { lo: 0, hi: 100 };
  }
}

function priceRangeForBand(band: LeadQualityBand): { lo: number; hi: number } {
  switch (band) {
    case "low":
      return { lo: 5, hi: 10 };
    case "medium":
      return { lo: 15, hi: 30 };
    case "high":
      return { lo: 40, hi: 80 };
    case "premium":
      return { lo: 100, hi: 140 };
    default:
      return { lo: 15, hi: 30 };
  }
}

/**
 * Deterministic advisory dollar suggestion from quality summary — not applied to checkout in V1.
 */
export function computeLeadSuggestedPrice(summary: LeadQualitySummary): number {
  const { band, score } = summary;
  const sr = bandScoreRange(band);
  const pr = priceRangeForBand(band);
  const span = sr.hi - sr.lo;
  const t = span > 0 ? clamp((score - sr.lo) / span, 0, 1) : 0.5;
  const raw = pr.lo + t * (pr.hi - pr.lo);
  return Math.round(clamp(raw, pr.lo, pr.hi));
}
