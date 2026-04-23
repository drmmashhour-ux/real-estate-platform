import { NotificationType, WatchlistAlertSeverity, WatchlistAlertStatus, WatchlistAlertType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GrowthEmailQueueStatus, GrowthEmailQueueType } from "@prisma/client";
import { sendEmail, getNotificationEmail } from "@/lib/email/resend";
import { logError } from "@/lib/logger";
import { isNotificationDeliveryV1Enabled } from "@/lib/notifications/flags";

/**
 * Price drop on FSBO listing — in-app + optional email (uses watchlist-style row when watchlist exists).
 */
export async function triggerPriceDropAlert(input: {
  userId: string;
  listingId: string;
  oldPriceCents: number;
  newPriceCents: number;
}): Promise<void> {
  const title = "Price drop on a saved listing";
  const message = `Price changed from $${(input.oldPriceCents / 100).toFixed(0)} to $${(input.newPriceCents / 100).toFixed(0)}.`;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      listingId: input.listingId,
    },
  });

  const wl = await prisma.watchlist.findFirst({
    where: { userId: input.userId },
    select: { id: true },
  });
  if (wl) {
    const created = await prisma.watchlistAlert.create({
      data: {
        userId: input.userId,
        watchlistId: wl.id,
        listingId: input.listingId,
        alertType: WatchlistAlertType.price_changed,
        severity: WatchlistAlertSeverity.info,
        title,
        message,
        status: WatchlistAlertStatus.unread,
        metadata: { oldPriceCents: input.oldPriceCents, newPriceCents: input.newPriceCents } as object,
      },
    });
    const { scheduleAlertAnalysis } = await import("@/lib/alerts/analyze");
    scheduleAlertAnalysis(created.id, input.userId);
    if (isNotificationDeliveryV1Enabled()) {
      const { dispatchWatchlistAlert } = await import("@/lib/notifications/dispatcher");
      void dispatchWatchlistAlert(created.id);
    }
  }

  const skipLegacyEmail = isNotificationDeliveryV1Enabled() && Boolean(wl);
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } });
  if (!skipLegacyEmail && user?.email) {
    void sendEmail({
      to: user.email,
      subject: title,
      html: `<p>${message}</p>`,
    }).catch((e) => logError("price drop email", e));
  }
}

/** New listing match for saved search — queue digest + notify. */
export async function triggerNewListingMatchAlert(input: {
  userId: string;
  listingId: string;
  city: string;
}): Promise<void> {
  await prisma.growthEmailQueue.create({
    data: {
      userId: input.userId,
      type: GrowthEmailQueueType.FOLLOWUP,
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: new Date(),
      payload: { campaign: "new_listings", listingId: input.listingId, city: input.city } as object,
    },
  });
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: NotificationType.SYSTEM,
      title: "New listing match",
      message: `A new property in ${input.city} matches your interests.`,
      listingId: input.listingId,
    },
  });
  const admin = getNotificationEmail();
  if (admin) {
    void sendEmail({
      to: admin,
      subject: "Listing alert fired",
      html: `<p>User ${input.userId} — new match ${input.listingId}</p>`,
    }).catch(() => {});
  }
}
