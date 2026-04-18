import { fetchRecentlyActiveFsbo } from "../candidates.service";
import type { RecommendationBlock, RecommendationContext } from "../recommendation.types";

/**
 * Surfaces listings with recent seller-side updates. Copy avoids claiming a price drop unless verified elsewhere.
 */
export async function recentUpdatesStrategy(ctx: RecommendationContext): Promise<RecommendationBlock | null> {
  const rows = await fetchRecentlyActiveFsbo(ctx.city ?? undefined, ctx.excludeIds ?? [], ctx.limit ?? 8, 10);
  /** Avoid a repetitive single-card strip when the pool is thin. */
  if (rows.length < 3) return null;
  return {
    strategy: "price_drop_opportunities",
    title: ctx.city ? `Recently updated in ${ctx.city}` : "Recently updated listings",
    subtitle: "Sellers changed details recently — confirm price and terms on the listing",
    explanation:
      "Sorted by internal quality score among listings with recent updates. Not every update is a price reduction.",
    items: rows.map((r) => ({
      id: r.id,
      kind: "fsbo" as const,
      title: r.title,
      priceLabel: `$${(r.priceCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`,
      city: r.city,
      coverImage: r.coverImage ?? (Array.isArray(r.images) ? r.images[0] ?? null : null),
      href: `/listings/${r.id}`,
    })),
    generatedAt: new Date().toISOString(),
  };
}
