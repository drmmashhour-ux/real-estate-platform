import { engineFlags } from "@/config/feature-flags";
import {
  dedupeItemsAcrossBlocks,
  dedupeStrategies,
  diversifySectionTitles,
  dropAnemicBlocks,
} from "./recommendation.diversity";
import type { RecommendationBlock, RecommendationContext } from "./recommendation.types";
import { buildListingDetailRecommendations } from "./recommendation.engine";
import { becauseYouSavedStrategy } from "./strategies/because-you-saved.strategy";
import { recentUpdatesStrategy } from "./strategies/recent-updates.strategy";
import { trendingStrategy } from "./strategies/trending.strategy";

export async function getRecommendationsForListingDetail(params: {
  ctx: RecommendationContext;
  anchor: { id: string; city: string; propertyType: string | null; priceCents: number };
}): Promise<RecommendationBlock[]> {
  if (!engineFlags.recommendationsV1) return [];
  return buildListingDetailRecommendations(params);
}

/** Browse / home listing rail — anonymous, session, or user personalization with safe fallbacks. */
export async function getRecommendationsForBrowse(ctx: RecommendationContext): Promise<RecommendationBlock[]> {
  if (!engineFlags.recommendationsV1) return [];
  const baseExclude = [...(ctx.excludeIds ?? [])];
  const anonymous = !ctx.userId;
  /** Anonymous and cold sessions get broader trending + relaxed saved-path signals upstream. */
  const sparseHint = anonymous || ctx.sparseSession === true;

  const out: RecommendationBlock[] = [];
  const idSet = new Set(baseExclude);

  const trend = await trendingStrategy({
    ...ctx,
    excludeIds: [...idSet],
    limit: ctx.limit ?? 12,
    sparseSession: sparseHint,
  });
  if (trend) {
    out.push(trend);
    for (const it of trend.items) idSet.add(it.id);
  }

  if (ctx.userId) {
    const bys = await becauseYouSavedStrategy({
      ...ctx,
      excludeIds: [...idSet],
      sparseSession: ctx.sparseSession ?? sparseHint,
    });
    if (bys) {
      out.push(bys);
      for (const it of bys.items) idSet.add(it.id);
    }
  }

  const recent = await recentUpdatesStrategy({
    ...ctx,
    excludeIds: [...idSet],
    limit: 8,
  });
  if (recent) out.push(recent);

  let blocks = dedupeItemsAcrossBlocks(out);
  blocks = dedupeStrategies(blocks);
  blocks = diversifySectionTitles(blocks);
  blocks = dropAnemicBlocks(blocks, 2);
  return blocks;
}
