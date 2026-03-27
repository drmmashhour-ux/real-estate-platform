import { NotificationPriority, NotificationType, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getInvestorMetrics } from "@/modules/investor/investor-metrics";
import { getInvestorHubAnalytics } from "@/modules/investor/investor-analytics";

const META = { investor: true as const };

/**
 * Idempotent investor alerts: creates in-app notifications for INVESTOR users when thresholds hit.
 * Mobile push can subscribe to the same `Notification` rows later.
 */
export async function syncInvestorNotificationsFromMetrics(): Promise<{ created: number }> {
  const investors = await prisma.user.findMany({
    where: { role: PlatformRole.INVESTOR },
    select: { id: true },
  });
  if (investors.length === 0) return { created: 0 };

  const [metrics, hubs] = await Promise.all([getInvestorMetrics(7), getInvestorHubAnalytics(7)]);

  const last7Listings = metrics.listingsGrowth.reduce((a, p) => a + p.value, 0);
  const last7Tx = metrics.transactionsOverTime.reduce((a, p) => a + p.value, 0);
  const surge = last7Listings >= 10 || metrics.kpis.activeListings >= 50;

  let created = 0;

  for (const u of investors) {
    if (surge) {
      const dup = await prisma.notification.findFirst({
        where: {
          userId: u.id,
          type: NotificationType.SYSTEM,
          title: "Listing activity uptick",
          createdAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) },
        },
      });
      if (!dup) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.HIGH,
            title: "Listing activity uptick",
            message: `Trailing 7-day new listings (composite): ${last7Listings}. Active inventory: ${metrics.kpis.activeListings}.`,
            metadata: { ...META, kind: "listing_surge" } as object,
          },
        });
        created += 1;
      }
    }

    if (last7Tx >= 5) {
      const dup = await prisma.notification.findFirst({
        where: {
          userId: u.id,
          type: NotificationType.SYSTEM,
          title: "Transaction signals elevated",
          createdAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) },
        },
      });
      if (!dup) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.NORMAL,
            title: "Transaction signals elevated",
            message: `Composite transaction events (7d): ${last7Tx}.`,
            metadata: { ...META, kind: "transaction_activity" } as object,
          },
        });
        created += 1;
      }
    }

    const mLead = hubs.hubs.find((h) => h.hub === "mortgage_hub");
    if (mLead && mLead.dealsOrLeads >= 20) {
      const dup = await prisma.notification.findFirst({
        where: {
          userId: u.id,
          type: NotificationType.SYSTEM,
          title: "Mortgage funnel volume",
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
      });
      if (!dup) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.NORMAL,
            title: "Mortgage funnel volume",
            message: `MortgageHub leads (window): ${mLead.dealsOrLeads}.`,
            metadata: { ...META, kind: "mortgage_volume" } as object,
          },
        });
        created += 1;
      }
    }
  }

  return { created };
}

export async function listInvestorNotifications(userId: string, take = 50) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: take * 3,
  });
  return rows
    .filter((r) => {
      const m = r.metadata as { investor?: boolean } | null;
      return m?.investor === true;
    })
    .slice(0, take);
}
