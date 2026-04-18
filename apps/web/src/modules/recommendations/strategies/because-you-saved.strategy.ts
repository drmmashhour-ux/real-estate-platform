import { prisma } from "@/lib/db";
import type { RecommendationBlock, RecommendationContext } from "../recommendation.types";
import { similarListingsStrategy } from "./similar-listings.strategy";

/**
 * Uses the buyer's most recent save (excluding current page ids) as an anchor for similarity.
 */
export async function becauseYouSavedStrategy(ctx: RecommendationContext): Promise<RecommendationBlock | null> {
  if (!ctx.userId?.trim()) return null;

  const save = await prisma.buyerSavedListing.findFirst({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    select: {
      fsboListing: {
        select: {
          id: true,
          city: true,
          propertyType: true,
          priceCents: true,
        },
      },
    },
  });

  const anchor = save?.fsboListing;
  if (!anchor) return null;

  const exclude = new Set([...(ctx.excludeIds ?? []), anchor.id]);
  const sim = await similarListingsStrategy({
    ctx: { ...ctx, excludeIds: [...exclude], limit: ctx.limit ?? 8, city: anchor.city },
    anchor: {
      id: anchor.id,
      city: anchor.city,
      propertyType: anchor.propertyType,
      priceCents: anchor.priceCents,
    },
  });
  if (!sim) return null;

  return {
    ...sim,
    strategy: "because_you_saved",
    title: `Because you saved in ${anchor.city}`,
    subtitle: "Similar homes near your saved price range",
    explanation:
      "Based on your most recent saved listing — not a prediction of what you will buy. Availability can change.",
  };
}
