import type { BrainRecommendationDraft } from "./opportunity-detector";
import { recommendContentOpportunities } from "./content-recommender";
import { buildSeoRecommendations } from "./seo-opportunity";
import { recommendMonetization } from "./monetization-recommender";
import type { GrowthBrainSnapshot, ScoredBuyerIntent, ScoredGrowthLead } from "./types";
import { detectOpportunities } from "./opportunity-detector";

/**
 * Combines detectors + vertical recommenders into one action list.
 */
export function generateAllRecommendations(
  snapshot: GrowthBrainSnapshot,
  scoredLeads: ScoredGrowthLead[],
  scoredBuyers: ScoredBuyerIntent[]
): BrainRecommendationDraft[] {
  const core = detectOpportunities(snapshot, scoredLeads, scoredBuyers);
  const content = recommendContentOpportunities(snapshot);
  const seo = buildSeoRecommendations(snapshot);
  const money = recommendMonetization(snapshot);
  return [...core, ...content, ...seo, ...money];
}

export function mergeRecommendationBatches(
  primary: BrainRecommendationDraft[],
  secondary: BrainRecommendationDraft[]
): BrainRecommendationDraft[] {
  const seen = new Set<string>();
  const out: BrainRecommendationDraft[] = [];
  for (const r of [...primary, ...secondary]) {
    const k = `${r.type}:${r.domain}:${r.title.slice(0, 80)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
