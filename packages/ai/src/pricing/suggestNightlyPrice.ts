import type { HostAutopilotSettings } from "@prisma/client";
import type { IntelligenceScores, ListingSignals } from "@/lib/ai/core/types";
import { computeCompositeScore } from "@/lib/ai/intelligence/computeCompositeScore";
import { buildExplanation } from "@/lib/ai/intelligence/buildExplanation";
import { buildPricingReasonSummary, type ReasonContext } from "./buildPricingReasonSummary";
import type { DemandScoreResult } from "./calculateDemandScore";

export type NightlyPriceSuggestion = {
  currentPrice: number;
  suggestedPrice: number;
  deltaPct: number;
  confidenceScore: number;
  reasonSummary: string;
  /** Present when `listingSignals` was passed — unified intelligence layer. */
  intelligenceScores?: IntelligenceScores;
  compositeExplanation?: string;
};

function roundCleanPrice(n: number): number {
  if (n < 50) return Math.round(n);
  if (n < 200) return Math.round(n / 5) * 5;
  return Math.round(n / 10) * 10;
}

/**
 * Prices are in major currency units (e.g. CAD dollars), not cents.
 */
export function suggestNightlyPrice(input: {
  currentNightly: number;
  hostSettings: HostAutopilotSettings | null;
  demand: DemandScoreResult;
  occupancyRate: number;
  bookingVelocity: number;
  /** When set, blends confidence with unified `computeCompositeScore` (pricing domain). */
  listingSignals?: ListingSignals | null;
}): NightlyPriceSuggestion {
  const settings = input.hostSettings;
  const minP = settings?.minPrice ?? null;
  const maxP = settings?.maxPrice ?? null;
  const maxDailyPct = settings?.maxDailyChangePct ?? 15;

  let target = input.currentNightly;
  const d = input.demand.demandScore;
  const occ = input.occupancyRate;
  const vel = input.bookingVelocity;

  if (d > 0.72 && occ > 0.45) {
    target *= 1 + Math.min(0.12, (d - 0.72) * 0.4 + (occ - 0.45) * 0.15);
  } else if (d < 0.38 || (occ < 0.2 && input.currentNightly > 40)) {
    target *= 1 - Math.min(0.12, (0.38 - d) * 0.25 + (0.2 - occ) * 0.2);
  } else if (vel < 0.15 && d > 0.5) {
    target *= 0.97;
  }

  const maxDelta = maxDailyPct / 100;
  const minAllowed = input.currentNightly * (1 - maxDelta);
  const maxAllowed = input.currentNightly * (1 + maxDelta);
  target = Math.max(minAllowed, Math.min(maxAllowed, target));

  if (minP != null) target = Math.max(minP, target);
  if (maxP != null) target = Math.min(maxP, target);

  target = roundCleanPrice(target);

  const deltaPct =
    input.currentNightly > 0 ? ((target - input.currentNightly) / input.currentNightly) * 100 : 0;

  const ctx: ReasonContext = {
    demandHigh: d > 0.7,
    demandLow: d < 0.35,
    occupancyLow: occ < 0.25,
    viewsUpNoBookings: vel < 0.1 && d > 0.55,
    weekendPeak: false,
    cappedByMin: minP != null && target <= minP + 0.01,
    cappedByMax: maxP != null && target >= maxP - 0.01,
    cappedByDailyPct:
      (target <= input.currentNightly * (1 + maxDelta) + 0.01 &&
        target >= input.currentNightly * (1 - maxDelta) - 0.01 &&
        Math.abs(deltaPct) >= maxDailyPct - 0.5) ||
      Math.abs(target - input.currentNightly) / Math.max(input.currentNightly, 1) >= maxDelta - 0.001,
  };

  let confidenceScore = Math.min(
    0.95,
    0.45 + d * 0.25 + (1 - input.demand.competitionScore) * 0.2 + Math.min(occ, 1) * 0.1
  );

  let intelligenceScores: IntelligenceScores | undefined;
  let compositeExplanation: string | undefined;
  if (input.listingSignals) {
    const comp = computeCompositeScore({
      domain: "pricing",
      listing: input.listingSignals,
      userSignals: null,
    });
    intelligenceScores = comp.scores;
    compositeExplanation = buildExplanation("pricing", comp.scores, input.listingSignals);
    confidenceScore = Math.min(0.95, (confidenceScore + comp.confidenceScore) / 2);
  }

  return {
    currentPrice: input.currentNightly,
    suggestedPrice: target,
    deltaPct,
    confidenceScore,
    reasonSummary: buildPricingReasonSummary(ctx),
    intelligenceScores,
    compositeExplanation,
  };
}
