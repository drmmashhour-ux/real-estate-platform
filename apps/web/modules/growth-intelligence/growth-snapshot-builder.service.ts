/**
 * Builds a read-only GrowthSnapshot from existing Prisma/analytics tables.
 * No fabricated metrics — unavailable sections yield null/empty + availability notes.
 */

import { eventTimelineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { GrowthSignal } from "./growth.types";
import type { GrowthSnapshot } from "./growth.types";
import type { GrowthTimelineAggregation } from "./growth.types";
import { dedupeGrowthSignals } from "./detectors/growth-detector-utils";
import { detectRepeatDropoffPattern } from "./detectors/repeat-dropoff-pattern.detector";
import { detectStalledFunnel } from "./detectors/stalled-funnel.detector";
import { detectTrendReversal } from "./detectors/trend-reversal.detector";

export type BuildGrowthSnapshotParams = {
  locale?: string;
  country?: string;
  /** Restrict heavy queries — default caps listing-level rows */
  maxListingSamples?: number;
};

function isoNow(): string {
  return new Date().toISOString();
}

export async function buildGrowthSnapshot(params: BuildGrowthSnapshotParams): Promise<GrowthSnapshot> {
  const locale = params.locale ?? "en";
  const country = (params.country ?? "ca").toLowerCase();
  const maxN = Math.min(200, Math.max(20, params.maxListingSamples ?? 80));
  const availabilityNotes: string[] = [];
  const snapshotId = `snap_${Date.now().toString(36)}`;

  let inventoryByRegion: GrowthSnapshot["inventoryByRegion"] = [];
  let leadStats: GrowthSnapshot["leadStats"] = null;
  let funnelRatiosByListing: GrowthSnapshot["funnelRatiosByListing"] = [];
  let trustDistribution: GrowthSnapshot["trustDistribution"] = [];
  let legalReadinessSamples: GrowthSnapshot["legalReadinessSamples"] = [];
  let contentFreshness: GrowthSnapshot["contentFreshness"] = null;
  let campaignRollups: GrowthSnapshot["campaignRollups"] = [];
  let rankingHints: GrowthSnapshot["rankingHints"] = [];
  let demandSignals: GrowthSnapshot["demandSignals"] = [];

  try {
    const countryFilter = country
      ? { country: { equals: country.length === 2 ? country.toUpperCase() : country, mode: "insensitive" as const } }
      : {};
    const [byCity, activeByCity] = await Promise.all([
      prisma.fsboListing.groupBy({
        by: ["city"],
        where: { city: { not: "" }, ...countryFilter },
        _count: { id: true },
      }),
      prisma.fsboListing.groupBy({
        by: ["city"],
        where: {
          city: { not: "" },
          status: "ACTIVE",
          moderationStatus: "APPROVED",
          ...countryFilter,
        },
        _count: { id: true },
      }),
    ]);
    const activeMap = new Map(activeByCity.map((r) => [(r.city ?? "").trim().toLowerCase(), r._count.id]));
    inventoryByRegion = byCity.slice(0, 60).map((row) => {
      const city = row.city?.trim() || "unknown";
      const k = city.toLowerCase();
      return {
        regionKey: city,
        listingCount: row._count.id,
        activePublicCount: activeMap.get(k) ?? 0,
      };
    });
  } catch {
    availabilityNotes.push("inventory_by_region_unavailable");
  }

  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const [totalLeads, fsboLeads] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prisma.lead.count({ where: { createdAt: { gte: since }, fsboListingId: { not: null } } }).catch(() => 0),
    ]);
    leadStats = { totalLeadsWindow: totalLeads, fsboLeadCount: fsboLeads };
  } catch {
    availabilityNotes.push("lead_stats_unavailable");
  }

  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const views = await prisma.analyticsFunnelEvent.groupBy({
      by: ["listingId"],
      where: { name: "listing_view", createdAt: { gte: since }, listingId: { not: null } },
      _count: { id: true },
    });
    const contacts = await prisma.analyticsFunnelEvent.groupBy({
      by: ["listingId"],
      where: { name: "contact_click", createdAt: { gte: since }, listingId: { not: null } },
      _count: { id: true },
    });
    const contactMap = new Map(contacts.map((c) => [c.listingId, c._count.id]));
    funnelRatiosByListing = views
      .map((v) => {
        const vid = v.listingId as string;
        const vc = v._count.id;
        const cc = contactMap.get(vid) ?? 0;
        const ratio = vc > 0 ? cc / vc : 0;
        return { listingId: vid, views: vc, contactClicks: cc, ratio };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, maxN);
  } catch {
    availabilityNotes.push("funnel_events_unavailable");
  }

  try {
    const metrics = await prisma.fsboListing.findMany({
      select: { id: true, trustScore: true },
      take: maxN,
      orderBy: { updatedAt: "desc" },
    });
    let low = 0;
    let mid = 0;
    let high = 0;
    for (const m of metrics) {
      const t = m.trustScore ?? 0;
      if (t < 40) low += 1;
      else if (t < 70) mid += 1;
      else high += 1;
    }
    trustDistribution = [
      { band: "low", count: low },
      { band: "mid", count: mid },
      { band: "high", count: high },
    ];
    legalReadinessSamples = metrics.map((m) => ({
      listingId: m.id,
      readinessHint: m.trustScore,
    }));
  } catch {
    availabilityNotes.push("trust_distribution_unavailable");
  }

  try {
    const recent = await prisma.seoBlogPost.findMany({
      select: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    });
    const oldest = await prisma.seoBlogPost.findFirst({
      orderBy: { updatedAt: "asc" },
      select: { updatedAt: true },
    });
    const daysOld = oldest?.updatedAt
      ? Math.floor((Date.now() - oldest.updatedAt.getTime()) / 86400000)
      : null;
    contentFreshness = {
      oldestSeoBlogDays: daysOld,
      recentPostCount: recent.length,
    };
  } catch {
    availabilityNotes.push("seo_blog_freshness_unavailable");
  }

  try {
    const since = new Date(Date.now() - 14 * 86400000);
    const bySource = await prisma.analyticsFunnelEvent.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since }, source: { not: null } },
      _count: { id: true },
    });
    campaignRollups = await Promise.all(
      bySource.slice(0, 20).map(async (s) => {
        const src = s.source as string;
        const views = await prisma.analyticsFunnelEvent
          .count({
            where: { source: src, name: "listing_view", createdAt: { gte: since } },
          })
          .catch(() => 0);
        const contacts = await prisma.analyticsFunnelEvent
          .count({
            where: { source: src, name: "contact_click", createdAt: { gte: since } },
          })
          .catch(() => 0);
        const efficiency = views > 0 ? contacts / views : 0;
        return { sourceKey: src, views, contacts, efficiency };
      })
    );
  } catch {
    availabilityNotes.push("campaign_rollups_unavailable");
  }

  try {
    const ranked = await prisma.fsboListing.findMany({
      where: { rankingTotalScoreCache: { not: null } },
      select: { id: true, rankingTotalScoreCache: true },
      take: maxN,
      orderBy: { rankingCachedAt: "desc" },
    });
    rankingHints = ranked.map((r) => ({
      listingId: r.id,
      rankingScore: r.rankingTotalScoreCache,
    }));
  } catch {
    availabilityNotes.push("ranking_hints_unavailable");
  }

  try {
    const regions = inventoryByRegion.slice(0, 25);
    demandSignals = regions.map((r) => ({
      regionKey: r.regionKey,
      buyerIntentProxy: Math.min(1, leadStats ? leadStats.fsboLeadCount / Math.max(1, r.activePublicCount) : 0),
      supplyCount: r.activePublicCount,
    }));
  } catch {
    availabilityNotes.push("demand_signals_derive_failed");
  }

  return {
    id: snapshotId,
    collectedAt: isoNow(),
    locale,
    country,
    availabilityNotes,
    inventoryByRegion,
    leadStats,
    funnelRatiosByListing,
    trustDistribution,
    legalReadinessSamples,
    contentFreshness,
    campaignRollups,
    rankingHints,
    demandSignals,
    timelineAggregation,
  };
}

/** Timeline-only signals (deterministic); does not query the database — uses `snapshot.timelineAggregation`. */
export function buildGrowthTimelineSignalsFromSnapshot(snapshot: GrowthSnapshot): GrowthSignal[] {
  return dedupeGrowthSignals([
    ...detectTrendReversal(snapshot),
    ...detectStalledFunnel(snapshot),
    ...detectRepeatDropoffPattern(snapshot),
  ]);
}

export async function buildGrowthTimelineSignals(params: BuildGrowthSnapshotParams): Promise<GrowthSignal[]> {
  try {
    const snapshot = await buildGrowthSnapshot(params);
    return buildGrowthTimelineSignalsFromSnapshot(snapshot);
  } catch {
    return [];
  }
}
