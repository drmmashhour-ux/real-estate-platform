import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import type { BnhubRankingSignals } from "./bnhub-ranking.types";

export type ListingRowForRankingSignals = {
  id: string;
  city: string;
  createdAt: Date;
  maxGuests: number;
  nightPriceCents: number;
  photos: unknown;
  amenities: unknown;
  description: string | null;
  descriptionFr: string | null;
  verificationStatus: string;
  owner?: {
    hostPerformanceMetrics?: { score: number } | null;
  } | null;
};

function countPhotos(p: unknown): number {
  return Array.isArray(p) ? p.filter((x) => typeof x === "string").length : 0;
}

function countAmenities(a: unknown): number {
  return Array.isArray(a) ? a.length : 0;
}

function descLen(d: string | null, df: string | null): number {
  return [d, df].filter(Boolean).join(" ").trim().length;
}

/**
 * Batch-load ranking signals — read-only; never mutates listings.
 */
export async function loadBnhubRankingSignalsBatch(
  listings: ListingRowForRankingSignals[],
  windowDays = 30,
): Promise<Map<string, BnhubRankingSignals>> {
  const out = new Map<string, BnhubRankingSignals>();
  if (listings.length === 0) return out;

  const since = subDays(new Date(), Math.min(90, Math.max(7, windowDays)));
  const ids = listings.map((l) => l.id);

  const [grouped, peerRows] = await Promise.all([
    prisma.aiConversionSignal.groupBy({
      by: ["listingId", "eventType"],
      where: { listingId: { in: ids }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.shortTermListing.findMany({
      where: {
        listingStatus: "PUBLISHED",
        city: { in: [...new Set(listings.map((l) => l.city).filter(Boolean))] },
      },
      select: { city: true, nightPriceCents: true, maxGuests: true },
    }),
  ]);

  const counts = new Map<string, Record<string, number>>();
  for (const row of grouped) {
    const id = row.listingId;
    let m = counts.get(id);
    if (!m) {
      m = {};
      counts.set(id, m);
    }
    m[row.eventType] = row._count._all;
  }

  const peersByCity = new Map<string, number[]>();
  for (const r of peerRows) {
    const k = r.city?.trim().toLowerCase() ?? "";
    if (!k) continue;
    const arr = peersByCity.get(k) ?? [];
    if (r.nightPriceCents > 0) arr.push(r.nightPriceCents);
    peersByCity.set(k, arr);
  }

  const median = (nums: number[]): number | null => {
    if (nums.length === 0) return null;
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? Math.round((s[mid - 1]! + s[mid]!) / 2) : s[mid]!;
  };

  for (const l of listings) {
    const m = counts.get(l.id) ?? {};
    const impressions = m["search_view"] ?? 0;
    const clicks = m["listing_click"] ?? 0;
    const views = m["listing_view"] ?? 0;
    const starts = m["booking_started"] ?? 0;
    const completions = m["booking_completed"] ?? 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const viewToStartRate = views > 0 ? starts / views : 0;
    const startToPaidRate = starts > 0 ? completions / starts : 0;

    const totalEvents = impressions + clicks + views + starts + completions;
    const trafficVolumeScore = Math.min(1, Math.log1p(totalEvents) / Math.log1p(48));

    const cityKey = l.city?.trim().toLowerCase() ?? "";
    const peerPool = peersByCity.get(cityKey) ?? [];
    const peerMedian = median(peerPool);
    const priceVsPeerMedian =
      peerMedian != null && peerMedian > 0 && l.nightPriceCents > 0 ? l.nightPriceCents / peerMedian : null;

    const hostScore = l.owner?.hostPerformanceMetrics?.score;
    const hostResponsiveness01 =
      hostScore != null && Number.isFinite(hostScore) ? Math.min(1, Math.max(0, hostScore / 100)) : null;

    out.set(l.id, {
      listingId: l.id,
      listingAgeDays: Math.max(0, (Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      photoCount: countPhotos(l.photos),
      amenityCount: countAmenities(l.amenities),
      descriptionLen: descLen(l.description, l.descriptionFr),
      verified: l.verificationStatus === "VERIFIED",
      searchViews: impressions,
      clicks,
      listingViews: views,
      bookingStarts: starts,
      bookingsCompleted: completions,
      ctr,
      viewToStartRate,
      startToPaidRate,
      hostResponsiveness01,
      priceVsPeerMedian,
      peerMedianNightCents: peerMedian,
      peerSampleSize: peerPool.length,
      trafficVolumeScore,
    });
  }

  return out;
}
