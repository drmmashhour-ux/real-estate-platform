import { fetchTrendingFsbo } from "../candidates.service";
import type { RecommendationBlock, RecommendationContext } from "../recommendation.types";

/** Top internal ranking scores — truthful “value” framing without appraisal claims. */
export async function highValueDealsStrategy(ctx: RecommendationContext): Promise<RecommendationBlock | null> {
  const rows = await fetchTrendingFsbo(ctx.city ?? undefined, ctx.excludeIds ?? [], ctx.limit ?? 8);
  if (rows.length === 0) return null;
  return {
    strategy: "high_value_deals",
    title: ctx.city ? `Top-ranked picks in ${ctx.city}` : "Top-ranked picks",
    subtitle: "Strong trust + engagement signals in our catalog",
    explanation: "Ranked using stored platform scores — not an appraisal or investment advice.",
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
