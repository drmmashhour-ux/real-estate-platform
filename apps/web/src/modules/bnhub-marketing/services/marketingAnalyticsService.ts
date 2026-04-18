import { prisma } from "@/lib/db";

export async function aggregateCampaignMetrics(campaignId: string) {
  const rows = await prisma.bnhubCampaignDistribution.findMany({
    where: { campaignId },
  });
  return rows.reduce(
    (acc, r) => {
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      acc.leads += r.leads;
      acc.saves += r.saves;
      acc.shares += r.shares;
      acc.bookings += r.bookings;
      acc.spendCents += r.spendCents;
      acc.revenueAttributedCents += r.revenueAttributedCents;
      return acc;
    },
    {
      impressions: 0,
      clicks: 0,
      leads: 0,
      saves: 0,
      shares: 0,
      bookings: 0,
      spendCents: 0,
      revenueAttributedCents: 0,
    }
  );
}

export function computeEstimatedROI(revenueCents: number, spendCents: number): number | null {
  if (spendCents <= 0) return revenueCents > 0 ? null : 0;
  return (revenueCents - spendCents) / spendCents;
}

export async function getCampaignOverviewStats() {
  const [total, active, byChannel] = await Promise.all([
    prisma.bnhubMarketingCampaign.count(),
    prisma.bnhubMarketingCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.bnhubCampaignDistribution.groupBy({
      by: ["channelId"],
      _sum: {
        impressions: true,
        clicks: true,
        bookings: true,
        revenueAttributedCents: true,
      },
    }),
  ]);

  const channels = await prisma.bnhubDistributionChannel.findMany({
    where: { id: { in: byChannel.map((b) => b.channelId) } },
  });
  const chMap = new Map(channels.map((c) => [c.id, c]));

  const channelPerf = byChannel.map((b) => ({
    channel: chMap.get(b.channelId)?.code ?? b.channelId,
    impressions: b._sum.impressions ?? 0,
    clicks: b._sum.clicks ?? 0,
    bookings: b._sum.bookings ?? 0,
    revenueAttributedCents: b._sum.revenueAttributedCents ?? 0,
  }));

  /** Heuristic multiplier on raw impressions — not a third-party reach guarantee; label surfaced in `labels.reach`. */
  const estimatedReach = byChannel.reduce((s, b) => s + (b._sum.impressions ?? 0), 0) * 1.15;

  return {
    totalCampaigns: total,
    activeCampaigns: active,
    channelPerf,
    estimatedReach: Math.round(estimatedReach),
    estimatedBookingsInfluenced: byChannel.reduce((s, b) => s + (b._sum.bookings ?? 0), 0),
    labels: {
      reach: "Estimated reach (internal + mock external weighted)",
      bookings: "Attributed bookings (partially simulated for external mocks)",
    },
  };
}

export async function getListingPromotionStats(listingId: string) {
  const campaigns = await prisma.bnhubMarketingCampaign.findMany({
    where: { listingId },
    select: { id: true, campaignName: true, status: true },
  });
  const ids = campaigns.map((c) => c.id);
  let total = {
    impressions: 0,
    clicks: 0,
    leads: 0,
    bookings: 0,
    revenueAttributedCents: 0,
  };
  for (const cId of ids) {
    const x = await aggregateCampaignMetrics(cId);
    total.impressions += x.impressions;
    total.clicks += x.clicks;
    total.leads += x.leads;
    total.bookings += x.bookings;
    total.revenueAttributedCents += x.revenueAttributedCents;
  }
  return { campaigns: campaigns.length, ...total };
}

export async function getChannelPerformance() {
  const overview = await getCampaignOverviewStats();
  return overview.channelPerf;
}
