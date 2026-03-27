import type {
  DailyDealCandidate,
  FeedInteractionSignal,
  FeedPreferences,
  RankedDailyDealItem,
} from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";
import { computeEngagementFit, computePersonalizationFit } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedPersonalizationService";
import { buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";
import { computeScores } from "@/src/core/intelligence/scoring/scoringEngine";

function norm(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function freshnessScore(days: number): number {
  if (days <= 1) return 100;
  if (days <= 3) return 82;
  if (days <= 7) return 64;
  if (days <= 14) return 40;
  return 20;
}

function riskPenalty(riskScore: number): number {
  if (riskScore >= 85) return 28;
  if (riskScore >= 70) return 18;
  if (riskScore >= 55) return 9;
  return 0;
}

function lowConfidencePenalty(confidence: number): number {
  if (confidence < 30) return 20;
  if (confidence < 45) return 12;
  if (confidence < 60) return 6;
  return 0;
}

export function rankDailyDeals(args: {
  candidates: DailyDealCandidate[];
  preferences: FeedPreferences | null;
  interactions: FeedInteractionSignal[];
  onboardingRole?: string | null;
}): RankedDailyDealItem[] {
  const scored = args.candidates.map((c) => {
    const personalization = computePersonalizationFit({
      candidate: c,
      preferences: args.preferences,
      interactions: args.interactions,
      onboardingRole: args.onboardingRole,
    });
    const fresh = freshnessScore(c.freshnessDays);
    const engagement = computeEngagementFit({ candidate: c, interactions: args.interactions });

    const intelligenceScores = computeScores(
      buildListingSignals({
        priceCents: c.priceCents,
        trustScore: c.trustScore,
        riskScore: c.riskScore,
        freshnessDays: c.freshnessDays,
        rentalDemand: c.listingMode?.toLowerCase() === "rent_short" ? 80 : 58,
      })
    );

    const weighted =
      intelligenceScores.dealScore * 0.35 +
      intelligenceScores.trustScore * 0.25 +
      personalization.score * 0.15 +
      fresh * 0.1 +
      intelligenceScores.confidenceScore * 0.1 +
      engagement * 0.05;

    const penalties = riskPenalty(c.riskScore) + lowConfidencePenalty(c.confidence);
    const final = Math.max(0, Math.round(weighted - penalties));

    return {
      ...c,
      score: final,
      bucket: "needs_review" as const,
      rankPosition: 0,
      breakdown: {
        deal: norm(intelligenceScores.dealScore * 0.35),
        trust: norm(intelligenceScores.trustScore * 0.25),
        personalization: norm(personalization.score * 0.15),
        freshness: norm(fresh * 0.1),
        confidence: norm(intelligenceScores.confidenceScore * 0.1),
        engagement: norm(engagement * 0.05),
        penalties: norm(penalties),
      },
      explanation: {
        headline: "",
        detail: "",
        confidenceNote: "",
      },
      badges: personalization.reasons,
      isNewToUser: !args.interactions.some((i) => i.listingId === c.listingId),
    };
  });

  return scored.sort((a, b) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime());
}
