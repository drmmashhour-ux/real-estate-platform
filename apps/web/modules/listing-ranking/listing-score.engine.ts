import { applyRankingRules, type RankingBadgeId } from "@/modules/listing-ranking/ranking.algorithm";
import { logInfo } from "@/lib/logger";

const TAG = "[ranking]";

export type ListingScoreInput = {
  /** 0–100 semantic ESG strength (e.g. from green tier / internal score). */
  esgScore: number;
  /** 0–100 from analytics or heuristic. */
  priceCompetitiveness: number;
  /** Views + leads normalized to 0–100 */
  engagementScore: number;
  /** Profile / media / declaration completeness 0–100 */
  completeness: number;
  /** Listing copy / AI quality 0–100 */
  aiOptimizationScore: number;
  verified: boolean;
  featured: boolean;
};

export type ListingScoreResult = {
  score: number;
  rankBoost: number;
  suggestions: string[];
  badges: RankingBadgeId[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Composite LECIPM listing quality score (0–100) plus sort boost and improvement tips.
 */
export function computeListingScore(input: ListingScoreInput): ListingScoreResult {
  const weights = {
    esg: 0.15,
    price: 0.2,
    engagement: 0.25,
    complete: 0.25,
    ai: 0.15,
  };

  const weighted =
    input.esgScore * weights.esg +
    input.priceCompetitiveness * weights.price +
    input.engagementScore * weights.engagement +
    input.completeness * weights.complete +
    input.aiOptimizationScore * weights.ai;

  let score = clamp(Math.round(weighted), 0, 100);

  const rules = applyRankingRules({
    esgGreen: input.esgScore >= 72,
    engagementPct: input.engagementScore,
    contentOptimized: input.aiOptimizationScore >= 70 && input.completeness >= 65,
    verified: input.verified,
  });

  if (input.featured) {
    score = clamp(score + 3, 0, 100);
  }

  const suggestions: string[] = [];
  if (input.completeness < 70) suggestions.push("Add photos, declaration sections, and contact clarity to lift completeness.");
  if (input.engagementScore < 45) suggestions.push("Improve title and hero image to increase views and inquiries.");
  if (input.priceCompetitiveness < 55) suggestions.push("Review pricing vs. neighborhood demand signals.");
  if (input.esgScore < 50 && input.esgScore > 0) suggestions.push("Complete green profile fields to qualify for eco badges.");

  logInfo(`${TAG} listing-score`, { score, rankBoost: rules.rankBoost });

  return {
    score,
    rankBoost: rules.rankBoost,
    suggestions: suggestions.slice(0, 4),
    badges: rules.badges,
  };
}

/** Map raw platform fields to normalized 0–100 inputs. */
export function normalizeEngagement(viewCount: number, leadCount: number): number {
  const v = Math.log1p(viewCount) * 18;
  const l = Math.log1p(leadCount) * 22;
  return clamp(Math.round(v + l), 0, 100);
}

export function esgScoreFromListing(greenTier: string | null | undefined, greenInternal: number | null | undefined): number {
  const tier = (greenTier ?? "none").toLowerCase();
  if (tier === "gold" || tier === "green" || tier === "platinum") return 90;
  if (tier === "silver" || tier === "standard") return 72;
  if (typeof greenInternal === "number" && greenInternal > 0) return clamp(greenInternal, 0, 100);
  return 35;
}
