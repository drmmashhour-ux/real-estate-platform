import type { PrismaClient } from "@prisma/client";
import type {
  BuyerSessionSummary,
  DemandRow,
  GrowthBrainSnapshot,
  GrowthLeadSummary,
  InventoryRow,
  ListingPerformanceRow,
} from "./types";

const DAYS_7 = 7 * 86_400_000;

/**
 * Aggregates platform signals into one snapshot. Safe when tables are empty (sparse mode).
 */
export async function buildGrowthBrainSnapshot(prisma: PrismaClient): Promise<GrowthBrainSnapshot> {
  const now = Date.now();
  const since7d = new Date(now - DAYS_7);
  const generatedAt = new Date();

  let sparse = false;

  const [
    fsboByCity,
    bnhubByCity,
    segments,
    analyticsRows,
    staleLeads,
    hotLeads,
    behaviorCount,
    growthLeadCount,
    brokerHints,
  ] = await Promise.all([
    groupFsboByCity(prisma),
    groupBnhubByCity(prisma),
    prisma.marketSegmentLearningStats.findMany({ orderBy: { trendScore: "desc" }, take: 40 }).catch(() => []),
    prisma.listingAnalytics
      .findMany({
        orderBy: { viewsTotal: "desc" },
        take: 80,
      })
      .catch(() => []),
    prisma.growthEngineLead
      .findMany({
        where: {
          archivedAt: null,
          OR: [{ needsFollowUp: true }, { stage: { in: ["awaiting_assets", "interested"] } }],
        },
        take: 60,
        orderBy: { updatedAt: "asc" },
      })
      .catch(() => []),
    prisma.growthEngineLead
      .findMany({
        where: {
          archivedAt: null,
          permissionStatus: { in: ["granted", "granted_by_source"] },
          stage: { in: ["interested", "awaiting_assets"] },
        },
        take: 30,
        orderBy: { updatedAt: "desc" },
      })
      .catch(() => []),
    prisma.userBehaviorEvent.count({ where: { createdAt: { gte: since7d } } }).catch(() => 0),
    prisma.growthEngineLead.count({ where: { archivedAt: null } }).catch(() => 0),
    prisma.growthEngineLead
      .groupBy({
        by: ["city"],
        where: { archivedAt: null, role: "broker", city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 12,
      })
      .catch(() => []),
  ]);

  if (
    analyticsRows.length === 0 &&
    segments.length === 0 &&
    growthLeadCount === 0 &&
    behaviorCount < 5
  ) {
    sparse = true;
  }

  const inventoryByCityCategory = mergeInventory(fsboByCity, bnhubByCity);
  const demandByCityCategory: DemandRow[] = segments.map((s) => {
    const [city, cat] = splitSegmentKey(s.segmentKey);
    return {
      city,
      category: cat,
      impressionCount: s.impressionCount ?? 0,
      engagementWeighted: s.engagementWeighted ?? 0,
      trendScore: s.trendScore ?? 0.5,
    };
  });

  const listingRows: ListingPerformanceRow[] = analyticsRows.map((a) => ({
    kind: a.kind as ListingPerformanceRow["kind"],
    listingId: a.listingId,
    city: null,
    viewsTotal: a.viewsTotal,
    contactClicks: a.contactClicks,
    saves: a.saves,
    unlockStarts: a.unlockCheckoutStarts,
    unlockSuccesses: a.unlockCheckoutSuccesses,
    bookings: a.bookings,
    demandScore: a.demandScore,
  }));

  const topConverting = [...listingRows]
    .sort((a, b) => b.contactClicks + b.bookings * 3 - (a.contactClicks + a.bookings * 3))
    .slice(0, 15);

  const lowPerforming = [...listingRows]
    .filter((r) => r.viewsTotal >= 10 && r.contactClicks + r.unlockStarts < 2)
    .sort((a, b) => b.viewsTotal - a.viewsTotal)
    .slice(0, 15);

  const staleGrowthLeads: GrowthLeadSummary[] = staleLeads.map(mapLead);
  const hotGrowthLeads: GrowthLeadSummary[] = hotLeads.map(mapLead);

  const highIntentBuyers = await aggregateBuyerSessions(prisma, since7d).catch(() => []);

  const risingSegments = demandByCityCategory.filter((d) => d.trendScore >= 0.55).slice(0, 12);

  const seoCoverageGaps = buildSeoGaps(inventoryByCityCategory);

  const ratios = listingRows
    .map((r) =>
      r.unlockStarts > 0 ? Math.min(1, r.unlockSuccesses / Math.max(1, r.unlockStarts)) : null
    )
    .filter((x): x is number => x != null);
  const avgUnlock =
    ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;

  const segmentsWithStrongUnlock = listingRows
    .filter((r) => r.unlockStarts >= 3 && r.unlockSuccesses / Math.max(1, r.unlockStarts) >= 0.4)
    .slice(0, 5)
    .map((r) => r.listingId);

  return {
    generatedAt,
    sparse,
    inventoryByCityCategory,
    demandByCityCategory,
    topConvertingListings: topConverting,
    lowPerformingListings: lowPerforming,
    staleGrowthLeads,
    hotGrowthLeads,
    highIntentBuyers,
    risingSegments,
    seoCoverageGaps,
    monetizationSignals: {
      avgUnlockStartToSuccessRatio: avgUnlock,
      segmentsWithStrongUnlock,
      brokerHeavyCities: brokerHints.map((b) => ({
        city: b.city ?? "",
        brokerLeadHint: b._count.city,
      })),
    },
    globalHints: {
      totalActiveGrowthLeads: growthLeadCount,
      totalBehaviorEvents7d: behaviorCount,
      totalListingAnalyticsRows: analyticsRows.length,
    },
  };
}

function mapLead(l: {
  id: string;
  role: string;
  city: string | null;
  category: string | null;
  stage: string;
  source: string;
  permissionStatus: string;
  needsFollowUp: boolean;
  updatedAt: Date;
  listingAcquisitionLeadId: string | null;
}): GrowthLeadSummary {
  return {
    id: l.id,
    role: l.role,
    city: l.city,
    category: l.category,
    stage: l.stage,
    source: l.source,
    permissionStatus: l.permissionStatus,
    needsFollowUp: l.needsFollowUp,
    updatedAt: l.updatedAt,
    listingAcquisitionLeadId: l.listingAcquisitionLeadId,
  };
}

async function groupFsboByCity(prisma: PrismaClient): Promise<{ city: string; count: number }[]> {
  const rows = await prisma.fsboListing.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 40,
  });
  return rows.map((r) => ({ city: r.city, count: r._count.city }));
}

async function groupBnhubByCity(prisma: PrismaClient): Promise<{ city: string; count: number }[]> {
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: "PUBLISHED" },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 40,
  });
  return rows.map((r) => ({ city: r.city, count: r._count.city }));
}

function mergeInventory(
  fsbo: { city: string; count: number }[],
  bnhub: { city: string; count: number }[]
): InventoryRow[] {
  const map = new Map<string, InventoryRow>();
  for (const f of fsbo) {
    map.set(f.city, {
      city: f.city,
      category: null,
      fsboCount: f.count,
      bnhubCount: 0,
      totalListings: f.count,
    });
  }
  for (const b of bnhub) {
    const cur = map.get(b.city);
    if (cur) {
      cur.bnhubCount = b.count;
      cur.totalListings = cur.fsboCount + b.count;
    } else {
      map.set(b.city, {
        city: b.city,
        category: null,
        fsboCount: 0,
        bnhubCount: b.count,
        totalListings: b.count,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.totalListings - a.totalListings);
}

function splitSegmentKey(key: string): [string, string | null] {
  const parts = key.split("|");
  return [parts[0] ?? key, parts[1] ?? null];
}

function buildSeoGaps(inv: InventoryRow[]): { city: string; kind: "fsbo" | "bnhub" | "both"; listingCount: number }[] {
  return inv
    .filter((r) => r.totalListings >= 3)
    .map((r) => ({
      city: r.city,
      kind: (r.fsboCount > 0 && r.bnhubCount > 0
        ? "both"
        : r.bnhubCount > 0
          ? "bnhub"
          : "fsbo") as "fsbo" | "bnhub" | "both",
      listingCount: r.totalListings,
    }))
    .slice(0, 20);
}

async function aggregateBuyerSessions(prisma: PrismaClient, since: Date): Promise<BuyerSessionSummary[]> {
  const events = await prisma.userBehaviorEvent.findMany({
    where: { createdAt: { gte: since } },
    select: {
      sessionId: true,
      userId: true,
      listingId: true,
      eventType: true,
      city: true,
    },
    take: 8_000,
  });

  const bySession = new Map<string, BuyerSessionSummary & { listingSet: Set<string> }>();

  for (const e of events) {
    const sid = e.sessionId;
    if (!bySession.has(sid)) {
      bySession.set(sid, {
        sessionId: sid,
        userId: e.userId,
        listingViews: 0,
        uniqueListings: 0,
        saves: 0,
        contactClicks: 0,
        unlockStarts: 0,
        unlockSuccesses: 0,
        bookingAttempts: 0,
        mapClicks: 0,
        filterEvents: 0,
        positiveDwell: 0,
        cities: [],
        listingSet: new Set(),
      });
    }
    const row = bySession.get(sid)!;
    if (e.userId) row.userId = e.userId;
    if (e.listingId) {
      row.listingSet.add(e.listingId);
      if (
        e.eventType === "LISTING_CLICK" ||
        e.eventType === "LISTING_IMPRESSION" ||
        e.eventType === "SEARCH_RESULT_IMPRESSION"
      ) {
        row.listingViews += 1;
      }
    }
    switch (e.eventType) {
      case "LISTING_SAVE":
        row.saves += 1;
        break;
      case "LISTING_CONTACT_CLICK":
        row.contactClicks += 1;
        break;
      case "LISTING_UNLOCK_START":
        row.unlockStarts += 1;
        break;
      case "LISTING_UNLOCK_SUCCESS":
        row.unlockSuccesses += 1;
        break;
      case "LISTING_BOOKING_ATTEMPT":
        row.bookingAttempts += 1;
        break;
      case "MAP_PIN_CLICK":
        row.mapClicks += 1;
        break;
      case "SEARCH_FILTERS_APPLIED":
        row.filterEvents += 1;
        break;
      case "DWELL_POSITIVE":
        row.positiveDwell += 1;
        break;
      default:
        break;
    }
    if (e.city && !row.cities.includes(e.city)) row.cities.push(e.city);
  }

  const out: BuyerSessionSummary[] = [];
  for (const [, v] of bySession) {
    v.uniqueListings = v.listingSet.size;
    const { listingSet: _, ...rest } = v;
    out.push(rest);
  }

  return out.sort((a, b) => scoreSessionRaw(b) - scoreSessionRaw(a)).slice(0, 40);
}

function scoreSessionRaw(s: BuyerSessionSummary): number {
  return (
    s.contactClicks * 5 +
    s.unlockStarts * 4 +
    s.unlockSuccesses * 8 +
    s.saves * 3 +
    s.bookingAttempts * 10 +
    s.mapClicks * 2 +
    s.listingViews * 0.15 +
    s.uniqueListings * 1.5
  );
}
