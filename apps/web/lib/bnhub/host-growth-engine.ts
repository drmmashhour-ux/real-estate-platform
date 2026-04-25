/**
 * BNHub host growth — insights, levels, alerts, and competitor framing.
 * Advisory only; never auto-applies pricing or listing changes.
 */

import type { BNHubHostListingPerformance, BNHubHostPerformanceSummary } from "@/modules/bnhub/host-performance/host-performance.types";
import {
  analyzeBnhubListingContentQuality,
  predictBnhubOccupancyBand,
  suggestBnhubNightlyPriceDeltaPercent,
} from "@/modules/bnhub/recommendationEngine";

export type HostGrowthLevel = "new_host" | "active_host" | "top_host";

export type GrowthInsightSeverity = "info" | "watch" | "opportunity";

export type GrowthInsight = {
  id: string;
  severity: GrowthInsightSeverity;
  title: string;
  body: string;
  /** Maps to actionable CTAs in the growth UI */
  action?: "adjust_price" | "update_description" | "add_amenities" | "add_photos" | "promotions";
};

export type GrowthAlertKind = "low_occupancy" | "high_demand" | "stale_listing" | "momentum";

export type GrowthAlert = {
  id: string;
  kind: GrowthAlertKind;
  title: string;
  body: string;
};

export type CompetitorSnapshot = {
  listingId: string;
  title: string;
  city: string | null;
  nightPriceCents: number;
  rating: number | null;
  reviewCount: number;
};

export type MonthlyBookingMetric = {
  key: string;
  label: string;
  bookings: number;
  revenueCents: number;
};

export type HostGrowthListingInput = {
  id: string;
  listingCode: string;
  title: string;
  city: string | null;
  nightPriceCents: number;
  description: string | null;
  photos: unknown;
  amenities: unknown;
  updatedAt: Date;
  bnhubListingCompletedStays: number;
  bnhubListingReviewCount: number;
  bnhubListingRatingAverage: number | null;
};

function photoCount(photos: unknown): number {
  return Array.isArray(photos) ? photos.filter((p): p is string => typeof p === "string").length : 0;
}

function amenitiesCount(amenities: unknown): number {
  return Array.isArray(amenities) ? amenities.length : 0;
}

export function computeHostGrowthLevel(input: {
  totalCompletedStays: number;
  strongListingCount: number;
  watchOrWeakListingCount: number;
  listingUpdatedWithinDays: number | null;
}): HostGrowthLevel {
  const { totalCompletedStays, strongListingCount, watchOrWeakListingCount, listingUpdatedWithinDays } = input;
  if (strongListingCount >= 1 && totalCompletedStays >= 10 && watchOrWeakListingCount === 0) {
    return "top_host";
  }
  if (totalCompletedStays >= 3 && (listingUpdatedWithinDays ?? 999) <= 90) {
    return "active_host";
  }
  return "new_host";
}

export function hostGrowthLevelCopy(level: HostGrowthLevel): { label: string; benefits: string[] } {
  switch (level) {
    case "top_host":
      return {
        label: "Top host",
        benefits: ["Eligible for visibility boosts in growth experiments", "Top host badge on qualifying listings"],
      };
    case "active_host":
      return {
        label: "Active host",
        benefits: ["Standard discovery placement", "Active host badge when listings stay fresh"],
      };
    default:
      return {
        label: "New host",
        benefits: ["Onboarding tips prioritized", "New host badge to build early trust"],
      };
  }
}

/** Median of peer nightly prices in cents (fallback: own price). */
export function medianPeerNightPriceCents(peers: { nightPriceCents: number }[], ownCents: number): number {
  if (!peers.length) return ownCents;
  const sorted = [...peers.map((p) => p.nightPriceCents)].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function buildGrowthInsightsForListing(
  listing: HostGrowthListingInput,
  performance: BNHubHostListingPerformance | null,
  peerMedianNightCents: number,
): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  const qc = analyzeBnhubListingContentQuality({
    photoCount: photoCount(listing.photos),
    description: listing.description,
    amenitiesCount: amenitiesCount(listing.amenities),
  });
  const priceHint = suggestBnhubNightlyPriceDeltaPercent({
    nightPriceCents: listing.nightPriceCents,
    completedStays: listing.bnhubListingCompletedStays,
    reviewAverage: listing.bnhubListingRatingAverage,
  });
  const occ = predictBnhubOccupancyBand({
    completedStaysLast90Days: Math.min(12, listing.bnhubListingCompletedStays),
    reviewAverage: listing.bnhubListingRatingAverage,
  });

  if (performance?.performanceStatus === "weak" || performance?.performanceStatus === "watch") {
    insights.push({
      id: `${listing.id}-underperform`,
      severity: "watch",
      title: "Your listing is underperforming",
      body:
        performance.rankingExplain?.[0] ??
        "Signals suggest room to improve content, pricing, or freshness versus similar stays — small updates often lift bookings.",
      action: "update_description",
    });
  }

  if (listing.nightPriceCents < peerMedianNightCents * 0.92) {
    insights.push({
      id: `${listing.id}-priced-low`,
      severity: "opportunity",
      title: "High demand opportunity",
      body: `Your nightly rate is below the typical similar listing in ${listing.city ?? "this area"}. If reviews are strong, testing a modest weekend increase may lift revenue without hurting conversion.`,
      action: "adjust_price",
    });
  } else if (listing.nightPriceCents > peerMedianNightCents * 1.12 && (listing.bnhubListingRatingAverage ?? 0) < 4.5) {
    insights.push({
      id: `${listing.id}-priced-high`,
      severity: "watch",
      title: "Price is above peers",
      body: "Similar listings are priced lower on median. Consider sharpening photos and reviews, or slightly easing rates until conversion picks up.",
      action: "adjust_price",
    });
  }

  if (priceHint.suggestedDeltaPercent > 0 && occ.highPct >= 55) {
    insights.push({
      id: `${listing.id}-weekend-premium`,
      severity: "opportunity",
      title: "Increase weekend pricing",
      body: "Occupancy signals look healthy — a targeted weekend premium (Fri–Sun) is often easier to absorb than a flat raise.",
      action: "adjust_price",
    });
  }

  if (photoCount(listing.photos) < 5) {
    insights.push({
      id: `${listing.id}-photos`,
      severity: "watch",
      title: "Add photos to improve bookings",
      body: "Listings with 8+ bright, wide-angle photos tend to earn more saves and bookings. Lead with your best living area shot.",
      action: "add_photos",
    });
  }

  if (!qc.ok) {
    insights.push({
      id: `${listing.id}-content`,
      severity: "info",
      title: qc.headline,
      body: qc.issues.slice(0, 2).join(" "),
      action: amenitiesCount(listing.amenities) < 3 ? "add_amenities" : "update_description",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: `${listing.id}-steady`,
      severity: "info",
      title: "Keep the momentum",
      body: "Refresh photos seasonally, reply to inquiries within an hour when possible, and trial a short last-minute discount when calendars gap.",
      action: "promotions",
    });
  }

  return insights.slice(0, 6);
}

export function buildGrowthAlerts(input: {
  avgOccupancyHighPct: number;
  listingsStaleDays: number | null;
  monthOverMonthBookingsDelta: number;
}): GrowthAlert[] {
  const alerts: GrowthAlert[] = [];
  if (input.avgOccupancyHighPct < 42) {
    alerts.push({
      id: "alert-low-occ",
      kind: "low_occupancy",
      title: "Low occupancy signal",
      body: "Your modeled occupancy band is soft. Try a limited-time discount, broaden minimum nights slightly, or refresh photos and title.",
    });
  }
  if (input.monthOverMonthBookingsDelta >= 2) {
    alerts.push({
      id: "alert-momentum",
      kind: "momentum",
      title: "Bookings are accelerating",
      body: "More trips confirmed vs last month — keep response times tight and consider a small premium on peak nights.",
    });
  }
  if ((input.listingsStaleDays ?? 0) > 45) {
    alerts.push({
      id: "alert-stale",
      kind: "stale_listing",
      title: "Listing looks stale",
      body: "You have not updated your listing in a while. Minor edits and new photos can re-trigger discovery without changing price.",
    });
  }
  if (input.avgOccupancyHighPct >= 68 && input.monthOverMonthBookingsDelta >= 0) {
    alerts.push({
      id: "alert-demand",
      kind: "high_demand",
      title: "High demand opportunity",
      body: "Strong occupancy signals — test weekend premiums or a seasonal package before discounting.",
    });
  }
  return alerts.slice(0, 4);
}

export function aggregateMonthlyBookingMetrics(
  rows: { createdAt: Date; priceSnapshotTotalCents: number | null; totalCents: number }[],
  monthsBack = 6,
): MonthlyBookingMetric[] {
  const now = new Date();
  const buckets: MonthlyBookingMetric[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-CA", { month: "short", year: "numeric" });
    buckets.push({ key, label, bookings: 0, revenueCents: 0 });
  }
  const indexByKey = new Map(buckets.map((b, idx) => [b.key, idx]));
  for (const r of rows) {
    const d = r.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = indexByKey.get(key);
    if (idx == null) continue;
    const b = buckets[idx]!;
    b.bookings += 1;
    const cents = r.priceSnapshotTotalCents ?? r.totalCents ?? 0;
    b.revenueCents += Math.max(0, cents);
  }
  return buckets;
}

/** Typical occupancy % estimate (midpoint of modeled band). */
export function estimatePortfolioOccupancyPercent(listings: HostGrowthListingInput[]): number {
  if (!listings.length) return 0;
  let sum = 0;
  for (const l of listings) {
    const occ = predictBnhubOccupancyBand({
      completedStaysLast90Days: Math.min(12, l.bnhubListingCompletedStays),
      reviewAverage: l.bnhubListingRatingAverage,
    });
    sum += (occ.lowPct + occ.highPct) / 2;
  }
  return Math.round(sum / listings.length);
}

/** Average upper bound of occupancy band — for demand-style alerts. */
export function averageOccupancyHighPercent(listings: HostGrowthListingInput[]): number {
  if (!listings.length) return 0;
  let sumHigh = 0;
  for (const l of listings) {
    const occ = predictBnhubOccupancyBand({
      completedStaysLast90Days: Math.min(12, l.bnhubListingCompletedStays),
      reviewAverage: l.bnhubListingRatingAverage,
    });
    sumHigh += occ.highPct;
  }
  return Math.round(sumHigh / listings.length);
}

export function revenueTrendDirection(metrics: MonthlyBookingMetric[]): "up" | "flat" | "down" {
  if (metrics.length < 2) return "flat";
  const a = metrics[metrics.length - 1]!.revenueCents;
  const b = metrics[metrics.length - 2]!.revenueCents;
  if (a > b * 1.08) return "up";
  if (a < b * 0.92) return "down";
  return "flat";
}

export function pickPerformanceRow(
  summary: BNHubHostPerformanceSummary | null,
  listingId: string,
): BNHubHostListingPerformance | null {
  return summary?.listings.find((l) => l.listingId === listingId) ?? null;
}
