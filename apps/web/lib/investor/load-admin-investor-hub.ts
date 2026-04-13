import { prisma } from "@/lib/db";
import { loadInvestorPlatformFunnel } from "@/src/modules/investor-metrics/investorFunnel";
import { loadFinancialProjections } from "@/src/modules/investor-metrics/investorProjections";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  getMarketplaceMetrics,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";
import { captureAndStoreMetricSnapshot, getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";
import type { AdminInvestorHubData } from "@/components/admin/AdminInvestorHubClient";

export async function loadAdminInvestorHubData(): Promise<AdminInvestorHubData> {
  const now = new Date();
  const [snapshots, liveSnap, kpis, marketplace, funnel, projections, pitchDeck] = await Promise.all([
    getRecentMetricSnapshots(90),
    aggregateSnapshotInputs(now),
    computeLiveKpis(now),
    getMarketplaceMetrics(now),
    loadInvestorPlatformFunnel(now, 30),
    loadFinancialProjections(now),
    (async () => {
      try {
        return await prisma.pitchDeck.findFirst({
          orderBy: { createdAt: "desc" },
          include: { slides: { orderBy: { order: "asc" } } },
        });
      } catch {
        return null;
      }
    })(),
  ]);

  let latest = snapshots[0] ?? null;
  if (!latest) {
    try {
      await captureAndStoreMetricSnapshot(now);
      const again = await getRecentMetricSnapshots(1);
      latest = again[0] ?? null;
    } catch {
      /* optional migration */
    }
  }

  const chartData = [...snapshots]
    .reverse()
    .map((r) => ({
      date: utcDayStart(r.date).toISOString().slice(0, 10),
      totalUsers: r.totalUsers,
      activeUsers: r.activeUsers,
      totalListings: r.totalListings,
      bookings: r.bookings,
      revenue: r.revenue,
      conversionPct: r.conversionRate * 100,
    }));

  const display = latest ?? {
    totalUsers: liveSnap.totalUsers,
    activeUsers: liveSnap.activeUsers,
    totalListings: liveSnap.totalListings,
    bookings: liveSnap.bookings,
    revenue: liveSnap.revenue,
    conversionRate: liveSnap.conversionRate,
    date: utcDayStart(now),
  };

  return {
    chartData,
    display: {
      totalUsers: display.totalUsers,
      activeUsers: display.activeUsers,
      totalListings: display.totalListings,
      bookings: display.bookings,
      revenue: display.revenue,
      conversionRate: display.conversionRate,
      dateLabel: utcDayStart(display.date).toISOString().slice(0, 10),
    },
    kpis: {
      activeUsersPct: kpis.activeUsersPct,
      bookingRate: kpis.bookingRate,
      revenuePerUser: kpis.revenuePerUser,
      cac: kpis.cac,
    },
    marketplace: {
      buyerPersonaUsers: marketplace.buyerPersonaUsers,
      buyersToListingsRatio: marketplace.buyersToListingsRatio,
      supplyDemandIndex: marketplace.supplyDemandIndex,
      brokerResponseRate: marketplace.brokerResponseRate,
      brokerResponseSampleSize: marketplace.brokerResponseSampleSize,
    },
    pitchDeck: pitchDeck
      ? {
          title: pitchDeck.title,
          createdAtLabel: `${pitchDeck.createdAt.toISOString().slice(0, 19)}Z`,
          slides: pitchDeck.slides.map((s) => ({
            order: s.order,
            type: s.type,
            title: s.title,
            content: s.content,
          })),
        }
      : null,
    funnel,
    projections,
  };
}
