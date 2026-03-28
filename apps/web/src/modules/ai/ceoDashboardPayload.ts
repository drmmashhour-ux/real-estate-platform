import { prisma } from "@/lib/db";
import { getBestChannels, getBestListings } from "@/src/modules/ai/growthEngine";
import { getMarketingEngagementStats } from "@/src/modules/ai/contentEngine";

export type CeoDashboardRunRow = {
  id: string;
  status: string;
  createdAt: Date;
  metricsSnapshot?: unknown;
  proposedActions?: unknown;
  executionLog?: unknown;
  opsAlerts?: unknown;
};

export type CeoDashboardPayload = {
  engagement: { ceoPosts: number; posted: number; failed: number };
  runs: CeoDashboardRunRow[];
  topListings: { listingId: string; listingCode?: string | null; views: number }[];
  channels: { channel: string; leads: number }[];
  revenueHints: {
    listingId: string;
    listingCode?: string | null;
    nightPriceCents: number;
    suggestedNightPriceCents: number;
    rationale: string;
  }[];
  premiumRecs: { product: string; rationale: string }[];
};

async function buildRevenueHints() {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { id: true, listingCode: true, nightPriceCents: true, city: true },
  });
  return rows.map((r) => {
    const bump = Math.round(r.nightPriceCents * 1.05);
    return {
      listingId: r.id,
      listingCode: r.listingCode,
      nightPriceCents: r.nightPriceCents,
      suggestedNightPriceCents: bump,
      rationale: `Demand signal in ${r.city}: +5% test band on base nightly rate.`,
    };
  });
}

export async function getCeoDashboardPayload(): Promise<CeoDashboardPayload> {
  const [engagement, channels, topListings, revenueHints] = await Promise.all([
    getMarketingEngagementStats(7),
    getBestChannels(30, 12),
    getBestListings(14, 10),
    buildRevenueHints(),
  ]);

  const premiumRecs = [
    { product: "BNHub host boost", rationale: "Surface triple-verified stays in high-view corridors." },
    { product: "Broker workspace seats", rationale: "Attach CRM automation to active lead funnels." },
    { product: "Expert mortgage unlocks", rationale: "Convert warm listing viewers with pre-approval nudges." },
  ];

  return {
    engagement,
    runs: [],
    topListings,
    channels,
    revenueHints,
    premiumRecs,
  };
}
