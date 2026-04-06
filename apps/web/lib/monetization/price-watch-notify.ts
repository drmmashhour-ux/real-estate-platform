import { NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";

/**
 * Notify users watching a Supabase listing when price drops meaningfully.
 */
export async function notifyBnhubPriceWatchers(params: {
  supabaseListingId: string;
  previousPriceCents: number;
  newPriceCents: number;
  listingTitle?: string | null;
}): Promise<{ notified: number }> {
  const listingId = params.supabaseListingId.trim();
  if (!listingId || params.newPriceCents >= params.previousPriceCents) {
    return { notified: 0 };
  }

  const watches = await prisma.bnhubListingPriceWatch.findMany({
    where: { supabaseListingId: listingId },
    select: { userId: true, id: true },
  });

  const title = params.listingTitle?.trim() || "A saved stay";
  let notified = 0;

  for (const w of watches) {
    void createBnhubMobileNotification({
      userId: w.userId,
      title: "Price drop",
      message: `“${title.slice(0, 80)}” is now lower — open the app to book.`,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      actionUrl: `/bnhub/listings/${listingId}`,
      actionLabel: "View",
      metadata: {
        kind: "price_drop",
        listingId,
        previousPriceCents: params.previousPriceCents,
        newPriceCents: params.newPriceCents,
      },
      pushData: { type: "price_drop", listingId },
    }).catch(() => {});

    await prisma.bnhubListingPriceWatch.update({
      where: { id: w.id },
      data: { lastKnownPriceCents: params.newPriceCents, lastNotifiedAt: new Date() },
    });
    notified += 1;
  }

  return { notified };
}
