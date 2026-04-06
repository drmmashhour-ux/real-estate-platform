import { BnhubDiscoveryAlertType, NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";

/**
 * Notify users subscribed to discovery alerts (new listings / promos in a city).
 */
export async function notifyBnhubDiscoverySubscribers(params: {
  alertType: BnhubDiscoveryAlertType;
  city?: string | null;
  supabaseListingId?: string | null;
  title: string;
  message: string;
}): Promise<{ notified: number }> {
  const city = params.city?.trim().toLowerCase() ?? null;
  const alerts = await prisma.bnhubDiscoveryAlert.findMany({
    where: {
      active: true,
      alertType: params.alertType,
      OR: [{ city: null }, ...(city ? [{ city }] : [])],
    },
    select: { userId: true, id: true },
    take: 500,
  });

  let notified = 0;
  for (const a of alerts) {
    void createBnhubMobileNotification({
      userId: a.userId,
      title: params.title,
      message: params.message,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.NORMAL,
      actionUrl: params.supabaseListingId ? `/bnhub/listings/${params.supabaseListingId}` : "/bnhub",
      actionLabel: "Explore",
      metadata: {
        discoveryAlertId: a.id,
        alertType: params.alertType,
        listingId: params.supabaseListingId ?? undefined,
      },
      pushData: { type: "discovery", alertType: params.alertType },
    }).catch(() => {});
    notified += 1;
  }

  return { notified };
}
