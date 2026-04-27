import { monolithPrisma } from "@/lib/db";

import type { ListingAgentInput } from "./listingAgent";
import type { PricingDataSource } from "@/lib/services/pricingEngine";

/**
 * Load listing fields for {@link analyzeListing} by domain id (CRM `Listing` vs BNHub `ShortTermListing`).
 */
export async function getListingAsAgentInput(
  listingId: string,
  source: PricingDataSource
): Promise<ListingAgentInput | null> {
  if (source === "bnhub") {
    const st = await monolithPrisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { title: true, description: true, nightPriceCents: true, photos: true },
    });
    if (!st) {
      return null;
    }
    const photos = Array.isArray(st.photos) ? (st.photos as unknown[]) : [];
    return {
      title: st.title,
      description: st.description,
      images: photos,
      price: st.nightPriceCents / 100,
    };
  }

  const l = await monolithPrisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true, price: true, assistantDraftContent: true },
  });
  if (!l) {
    return null;
  }
  const draft = l.assistantDraftContent;
  let description = "";
  if (draft && typeof draft === "object" && "body" in draft && typeof (draft as { body?: string }).body === "string") {
    description = (draft as { body: string }).body;
  } else if (typeof draft === "string") {
    description = draft;
  }
  return {
    title: l.title,
    description,
    price: l.price,
    images: [],
  };
}
