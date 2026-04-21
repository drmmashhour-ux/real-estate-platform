import { logInfo } from "@/lib/logger";

const TAG = "[ranking]";

export type RankingBadgeId = "high_potential" | "green_property" | "top_ranked";

export type RankingRuleInput = {
  esgGreen: boolean;
  engagementPct: number;
  contentOptimized: boolean;
  verified: boolean;
};

export type RankingAdjustment = {
  rankBoost: number;
  badges: RankingBadgeId[];
};

/** Applies platform boost rules — additive, capped for stability in sort keys. */
export function applyRankingRules(input: RankingRuleInput): RankingAdjustment {
  let rankBoost = 0;
  const badges: RankingBadgeId[] = [];

  if (input.esgGreen) {
    rankBoost += 8;
    badges.push("green_property");
  }
  if (input.engagementPct >= 70) {
    rankBoost += 10;
    if (!badges.includes("high_potential")) badges.push("high_potential");
  }
  if (input.contentOptimized) {
    rankBoost += 6;
  }
  if (input.verified) {
    rankBoost += 7;
  }

  const composite = input.esgGreen && input.verified && input.engagementPct >= 55 && input.contentOptimized;
  if (composite && !badges.includes("top_ranked")) {
    badges.push("top_ranked");
    rankBoost += 5;
  }

  rankBoost = Math.min(rankBoost, 35);

  logInfo(`${TAG} rules`, {
    rankBoost,
    badges,
    engagementPct: input.engagementPct,
  });

  return { rankBoost, badges };
}

export const BADGE_LABEL: Record<RankingBadgeId, string> = {
  high_potential: "🔥 High Potential",
  green_property: "🌱 Green Property",
  top_ranked: "⭐ Top Ranked",
};
