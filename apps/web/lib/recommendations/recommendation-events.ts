import { SearchEventType } from "@prisma/client";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";

export type RecommendationWidgetSource = "similar" | "personalized" | "trending" | "recent" | "saved";

/**
 * Analytics for recommendation widgets — stored on `SearchEvent` metadata for admin aggregation.
 */
export async function logRecommendationEngagement(input: {
  userId?: string | null;
  listingId: string;
  widget: string;
  source: RecommendationWidgetSource;
  listingKind: "bnhub" | "fsbo";
  event: "impression" | "click";
}): Promise<void> {
  const eventType = input.event === "click" ? SearchEventType.CLICK : SearchEventType.VIEW;
  await trackSearchEvent({
    eventType,
    userId: input.userId ?? undefined,
    listingId: input.listingId,
    metadata: {
      reco: true,
      recoWidget: input.widget,
      recoSource: input.source,
      listingKind: input.listingKind,
    },
  });
}
