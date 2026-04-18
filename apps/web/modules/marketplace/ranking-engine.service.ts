import { BRAIN_RANKING_ADAPTIVE_CAP } from "@/modules/platform-core/brain-v2.constants";
import { oneBrainV3Flags } from "@/config/feature-flags";
import { applyCrossDomainRankingAdjustment as applyV3ListingBoost } from "@/modules/platform-core/brain-v3-runtime-cache";

/**
 * Listing rank blend — combines base listing score with optional One Brain trust and performance (0–1 inputs).
 */
export function computeListingRank(input: {
  baseScore: number;
  trustScore?: number;
  performanceScore?: number;
}) {
  const trust = input.trustScore ?? 0;
  const performance = input.performanceScore ?? 0;

  const score = input.baseScore * 0.4 + trust * 0.3 + performance * 0.3;

  return Number(score.toFixed(4));
}

/**
 * One Brain V2 — conservative multiplicative adjustment from average adaptive source weight (±10% max).
 */
export function applyAdaptiveSourceRankingMultiplier(blended01: number, avgSourceWeight: number): number {
  const delta = 0.2 * (avgSourceWeight - 1);
  const clamped = Math.max(-BRAIN_RANKING_ADAPTIVE_CAP, Math.min(BRAIN_RANKING_ADAPTIVE_CAP, delta));
  return Number((blended01 * (1 + clamped)).toFixed(4));
}

/**
 * One Brain V3 — bounded cross-domain nudge on listing blend (requires runtime snapshot from learning runs).
 */
export function applyCrossDomainRankingAdjustment(input: { listingId: string; blended01: number }): number {
  if (!oneBrainV3Flags.oneBrainV3CrossDomainV1) return input.blended01;
  return applyV3ListingBoost(input);
}
