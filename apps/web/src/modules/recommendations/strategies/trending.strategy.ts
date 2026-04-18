import { fetchTrendingFsbo } from "../candidates.service";
import type { RecommendationBlock, RecommendationContext } from "../recommendation.types";
import { defaultSubtitle } from "../recommendation.explainer";

export async function trendingStrategy(ctx: RecommendationContext): Promise<RecommendationBlock | null> {
  const rows = await fetchTrendingFsbo(ctx.city ?? undefined, ctx.excludeIds ?? [], ctx.limit ?? 8);
  if (rows.length === 0) return null;
  const sparse = ctx.sparseSession === true;
  return {
    strategy: "trending_now",
    title: ctx.city ? `Popular in ${ctx.city}` : "Trending listings",
    subtitle: defaultSubtitle("trending_now", ctx.city),
    explanation: sparse
      ? "Quality-ranked catalog picks — personalization is limited until you sign in or build history."
      : "Ordered using stored quality and engagement signals — no fabricated demand.",
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
