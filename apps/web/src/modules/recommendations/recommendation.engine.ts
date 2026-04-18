import { prisma } from "@/lib/db";
import { recentSessionEvents } from "@/src/modules/events/event-queries.service";
import { dedupeItemsAcrossBlocks, dedupeStrategies, diversifySectionTitles } from "./recommendation.diversity";
import type { RecommendationBlock, RecommendationContext } from "./recommendation.types";
import { becauseYouSavedStrategy } from "./strategies/because-you-saved.strategy";
import { recentUpdatesStrategy } from "./strategies/recent-updates.strategy";
import { similarListingsStrategy } from "./strategies/similar-listings.strategy";
import { trendingStrategy } from "./strategies/trending.strategy";

async function isSparseSession(sessionId: string | null | undefined, userId: string | null | undefined): Promise<boolean> {
  /** Anonymous viewers: prefer breadth over tight personalization (relaxed similar-listing matching). */
  if (!userId) return true;
  if (!sessionId) return true;
  const ev = await recentSessionEvents(sessionId, 24);
  const meaningful = ev.filter(
    (e) =>
      e.eventType === "listing_click" ||
      e.eventType === "listing_save" ||
      e.eventType === "listing_impression"
  );
  return meaningful.length < 2;
}

export async function buildListingDetailRecommendations(params: {
  ctx: RecommendationContext;
  anchor: { id: string; city: string; propertyType: string | null; priceCents: number };
}): Promise<RecommendationBlock[]> {
  const baseExclude = [...(params.ctx.excludeIds ?? []), params.anchor.id];
  const sparseSession = await isSparseSession(params.ctx.sessionId, params.ctx.userId ?? null);
  const ctx: RecommendationContext = { ...params.ctx, excludeIds: baseExclude, sparseSession };

  const out: RecommendationBlock[] = [];

  const sim = await similarListingsStrategy({
    ctx,
    anchor: params.anchor,
  });
  if (sim) out.push(sim);

  let bySavedBlock: RecommendationBlock | null = null;
  if (params.ctx.userId) {
    const savedCtx: RecommendationContext = {
      ...ctx,
      excludeIds: [...baseExclude, ...(sim?.items.map((i) => i.id) ?? [])],
    };
    bySavedBlock = await becauseYouSavedStrategy(savedCtx);
    if (bySavedBlock) out.push(bySavedBlock);
  }

  const simIds = new Set(sim?.items.map((i) => i.id) ?? []);
  const savedIds = new Set(bySavedBlock?.items.map((i) => i.id) ?? []);
  const trendExclude = [...baseExclude, ...simIds, ...savedIds];

  let becauseViewed = false;
  if (params.ctx.sessionId) {
    const ev = await recentSessionEvents(params.ctx.sessionId, 16);
    becauseViewed = ev.some((e) => e.eventType === "listing_click" || e.eventType === "listing_impression");
  }

  let trendCity = params.anchor.city;
  if (sparseSession && params.ctx.userId) {
    const profile = await prisma.userSearchProfile.findUnique({
      where: { userId: params.ctx.userId },
      select: { preferredCities: true },
    });
    const pref = profile?.preferredCities?.map((c) => c.trim()).filter(Boolean) ?? [];
    if (pref.length > 0 && !pref.some((c) => c.toLowerCase() === params.anchor.city.toLowerCase())) {
      trendCity = pref[0]!;
    }
  }

  const trend = await trendingStrategy({
    ...ctx,
    excludeIds: trendExclude,
    city: trendCity,
  });

  if (trend) {
    if (becauseViewed && !sim) {
      out.push({
        ...trend,
        strategy: "because_you_viewed",
        title: "You may also like",
        subtitle: "Based on listings you recently viewed",
        explanation: "Uses your session activity plus quality signals — not a guarantee of fit.",
      });
    } else if (sim) {
      out.push({
        ...trend,
        title: sparseSession ? `Also popular${trendCity ? ` in ${trendCity}` : ""}` : "More listings to explore",
        subtitle: "Quality-ranked, de-duplicated from similar picks",
        explanation: "Diverse property types where possible; ranked by internal quality score.",
      });
    } else {
      out.push(trend);
    }
  }

  const recentCtx: RecommendationContext = {
    ...ctx,
    excludeIds: [...baseExclude, ...out.flatMap((b) => b.items.map((i) => i.id))],
    limit: 6,
  };
  const recent = await recentUpdatesStrategy(recentCtx);
  if (recent) out.push(recent);

  let blocks = dedupeItemsAcrossBlocks(out);
  blocks = dedupeStrategies(blocks);
  blocks = diversifySectionTitles(blocks);
  return blocks;
}
