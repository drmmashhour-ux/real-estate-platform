import { fetchSimilarFsbo } from "../candidates.service";
import type { RecommendationBlock, RecommendationContext } from "../recommendation.types";
import { defaultSubtitle } from "../recommendation.explainer";

export async function similarListingsStrategy(params: {
  ctx: RecommendationContext;
  anchor: { id: string; city: string; propertyType: string | null; priceCents: number };
}): Promise<RecommendationBlock | null> {
  const exclude = [...(params.ctx.excludeIds ?? []), params.anchor.id];
  const rows = await fetchSimilarFsbo({
    city: params.anchor.city,
    excludeIds: exclude,
    propertyType: params.anchor.propertyType,
    priceCents: params.anchor.priceCents,
    limit: params.ctx.limit ?? 8,
    relaxedPropertyMatch: params.ctx.sparseSession === true,
  });
  if (rows.length === 0) return null;
  return {
    strategy: "similar_listings",
    title: `Similar properties${params.anchor.city ? ` in ${params.anchor.city}` : ""}`,
    subtitle: defaultSubtitle("similar_listings", params.anchor.city),
    explanation: params.ctx.sparseSession
      ? "Same city and price range — property type relaxed because your recent activity is limited."
      : "Same city, similar price band, and property type when we have it.",
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
