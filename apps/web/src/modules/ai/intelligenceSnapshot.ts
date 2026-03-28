import { UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getBestChannels, getBestListings, getBestPages } from "@/src/modules/ai/growthEngine";

export type SearchHeatCell = { label: string; count: number };

/** Aggregate "search-like" signals: listing views + inquiries with optional city in metadata. */
export async function getSearchHeatmap(sinceDays = 14, limit = 12): Promise<SearchHeatCell[]> {
  const since = subDays(new Date(), sinceDays);
  const [views, inquiries] = await Promise.all([
    prisma.userEvent.findMany({
      where: { eventType: UserEventType.LISTING_VIEW, createdAt: { gte: since } },
      select: { metadata: true },
      take: 3000,
    }),
    prisma.userEvent.findMany({
      where: { eventType: UserEventType.INQUIRY, createdAt: { gte: since } },
      select: { metadata: true },
      take: 1500,
    }),
  ]);

  const counts = new Map<string, number>();
  for (const r of views) {
    const m = r.metadata as { city?: string; listingId?: string } | null;
    const label = m?.city?.trim() || (m?.listingId ? "listing-browse" : "unknown");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  for (const r of inquiries) {
    const m = r.metadata as { city?: string } | null;
    const label = m?.city?.trim() ? `${m.city} (inquiry)` : "inquiry";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Funnel-style conversion from tracked events (approximate). */
export async function getConversionSnapshot(sinceDays = 14) {
  const since = subDays(new Date(), sinceDays);
  const types = [
    UserEventType.LISTING_VIEW,
    UserEventType.INQUIRY,
    UserEventType.BOOKING_START,
    UserEventType.PAYMENT_SUCCESS,
  ] as const;
  const counts: Record<string, number> = {};
  for (const t of types) {
    counts[t] = await prisma.userEvent.count({ where: { eventType: t, createdAt: { gte: since } } });
  }
  return { sinceDays, counts };
}

/** User segmentation — uses `user_scores` when migrated; otherwise zeros with total user count. */
export async function getUserSegmentation() {
  const ext = prisma as unknown as {
    userScore?: { count: (args?: object) => Promise<number> };
  };
  if (!ext.userScore) {
    const total = await prisma.user.count();
    return { hot: 0, warm: 0, cold: 0, total };
  }
  const [hot, warm, cold, total] = await Promise.all([
    ext.userScore.count({ where: { intentLevel: "hot" } }),
    ext.userScore.count({ where: { intentLevel: "warm" } }),
    ext.userScore.count({ where: { intentLevel: "cold" } }),
    ext.userScore.count(),
  ]);
  return { hot, warm, cold, total };
}

/** Full payload for the intelligence dashboard. */
export async function getIntelligenceDashboardPayload() {
  const [heatmap, topPages, topListings, channels, conversion, segments] = await Promise.all([
    getSearchHeatmap(14, 14),
    getBestPages(14, 12),
    getBestListings(14, 10),
    getBestChannels(30, 8),
    getConversionSnapshot(14),
    getUserSegmentation(),
  ]);
  return { heatmap, topPages, topListings, channels, conversion, segments };
}
