import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { onFsboPriceDropForWatchers } from "@/src/modules/alerts/price-drop.detector";

/**
 * Records an FSBO list price change for audit + price-drop pipelines.
 * Does not mutate the listing (caller already updated).
 */
export async function recordFsboListingPriceChange(args: {
  listingId: string;
  previousPriceCents: number;
  newPriceCents: number;
  changedByUserId?: string | null;
  reason?: string;
}): Promise<void> {
  await prisma.listingPriceHistory.create({
    data: {
      kind: ListingAnalyticsKind.FSBO,
      listingId: args.listingId,
      priceCents: args.newPriceCents,
      previousPriceCents: args.previousPriceCents,
      changedByUserId: args.changedByUserId ?? null,
      changeReason: args.reason ?? "seller_update",
    },
  });

  if (engineFlags.priceDropAlertsV1 && args.newPriceCents < args.previousPriceCents) {
    await onFsboPriceDropForWatchers({
      listingId: args.listingId,
      oldPriceCents: args.previousPriceCents,
      newPriceCents: args.newPriceCents,
    }).catch(() => null);
  }
}
