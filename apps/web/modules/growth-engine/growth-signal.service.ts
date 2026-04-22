import { prisma } from "@/lib/db";

import type {
  GrowthEntityKind,
  GrowthSignalCode,
  GrowthSignalSeverity,
  GrowthSignalVm,
} from "./growth-engine.types";

function id(signal: GrowthSignalCode, entityKind: GrowthEntityKind, entityId: string | null, region?: string | null) {
  return `${signal}:${entityKind}:${entityId ?? "none"}:${region ?? ""}`;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Rule-based signal scan — explainable thresholds (tune via env later).
 */
export async function detectGrowthSignals(): Promise<GrowthSignalVm[]> {
  const signals: GrowthSignalVm[] = [];

  const [
    analyticsRows,
    staleFsbo,
    regionDemand,
    brokerGap,
    bnhubGap,
  ] = await Promise.all([
    prisma.listingAnalytics.findMany({
      where: {
        OR: [{ viewsTotal: { gte: 60 } }, { uniqueViews24hCached: { gte: 10 } }],
      },
      take: 400,
      orderBy: { viewsTotal: "desc" },
    }),
    prisma.fsboListing.findMany({
      where: { status: "ACTIVE", archivedAt: null },
      select: { id: true, updatedAt: true, city: true, ownerId: true },
      take: 200,
      orderBy: { updatedAt: "asc" },
    }),
    loadRegionDemandGap(),
    loadBrokerConversionGap(),
    loadBnhubOccupancyGap(),
  ]);

  const fsboIds = new Set(staleFsbo.map((l) => l.id));

  for (const a of analyticsRows) {
    const ratioBook =
      a.viewsTotal > 0 ? (a.bookings + a.bookingAttempts) / Math.max(1, a.viewsTotal / 40) : 0;
    if (
      a.kind === "BNHUB" &&
      a.viewsTotal >= 80 &&
      a.bookings < 2 &&
      (a.contactClicks >= 2 || a.bookingAttempts >= 2)
    ) {
      signals.push({
        id: id("high_views_low_booking", "bnhub_listing", a.listingId, null),
        signal: "high_views_low_booking",
        entityKind: "bnhub_listing",
        entityId: a.listingId,
        severity: ratioBook < 0.08 ? "high" : "medium",
        context: {
          viewsTotal: a.viewsTotal,
          bookings: a.bookings,
          bookingAttempts: a.bookingAttempts,
          contactClicks: a.contactClicks,
          heuristic: "views_high_bookings_low",
        },
        detectedAt: nowIso(),
      });
    }

    if ((a.kind === "FSBO" || a.kind === "CRM") && a.viewsTotal >= 50 && a.bookings + a.unlockCheckoutSuccesses < 1) {
      const kind: GrowthEntityKind = a.kind === "FSBO" ? "fsbo_listing" : "crm_listing";
      signals.push({
        id: id("high_views_low_booking", kind, a.listingId, null),
        signal: "high_views_low_booking",
        entityKind: kind,
        entityId: a.listingId,
        severity: a.viewsTotal >= 200 ? "high" : "medium",
        context: {
          viewsTotal: a.viewsTotal,
          contactClicks: a.contactClicks,
          saves: a.saves,
          unlockSuccesses: a.unlockCheckoutSuccesses,
        },
        detectedAt: nowIso(),
      });
    }

    if (a.viewsTotal >= 30 && a.contactClicks >= 5 && a.unlockCheckoutSuccesses === 0 && a.unlockCheckoutStarts >= 2) {
      signals.push({
        id: id("drop_off_point", a.kind === "BNHUB" ? "bnhub_listing" : a.kind === "FSBO" ? "fsbo_listing" : "crm_listing", a.listingId, null),
        signal: "drop_off_point",
        entityKind: a.kind === "BNHUB" ? "bnhub_listing" : a.kind === "FSBO" ? "fsbo_listing" : "crm_listing",
        entityId: a.listingId,
        severity: "medium",
        context: {
          unlockStarts: a.unlockCheckoutStarts,
          unlockSuccesses: a.unlockCheckoutSuccesses,
          viewsTotal: a.viewsTotal,
        },
        detectedAt: nowIso(),
      });
    }
  }

  const fourteenDaysAgo = Date.now() - 14 * 86400000;
  for (const row of staleFsbo) {
    if (row.updatedAt.getTime() < fourteenDaysAgo) {
      signals.push({
        id: id("inactive_listing", "fsbo_listing", row.id, row.city),
        signal: "inactive_listing",
        entityKind: "fsbo_listing",
        entityId: row.id,
        severity: "low",
        context: {
          lastUpdated: row.updatedAt.toISOString(),
          city: row.city,
        },
        detectedAt: nowIso(),
      });
    }
  }

  for (const r of regionDemand) {
    signals.push({
      id: id("high_demand_low_supply", "city_region", null, r.regionKey),
      signal: "high_demand_low_supply",
      entityKind: "city_region",
      entityId: null,
      regionKey: r.regionKey,
      severity: r.severity,
      context: r.context,
      detectedAt: nowIso(),
    });
  }

  for (const b of brokerGap) {
    signals.push({
      id: id("low_conversion", "broker_user", b.brokerUserId, null),
      signal: "low_conversion",
      entityKind: "broker_user",
      entityId: b.brokerUserId,
      severity: b.severity,
      context: b.context,
      detectedAt: nowIso(),
    });
  }

  for (const g of bnhubGap) {
    signals.push({
      id: id("price_misaligned", "bnhub_listing", g.listingId, null),
      signal: "price_misaligned",
      entityKind: "bnhub_listing",
      entityId: g.listingId,
      severity: "medium",
      context: g.context,
      detectedAt: nowIso(),
    });
  }

  const dedup = new Map<string, GrowthSignalVm>();
  for (const s of signals) {
    if (!dedup.has(s.id)) dedup.set(s.id, s);
  }
  return [...dedup.values()].slice(0, 150);
}

async function loadRegionDemandGap(): Promise<
  { regionKey: string; severity: GrowthSignalSeverity; context: Record<string, unknown> }[]
> {
  const rows = await prisma.fsboListing.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", archivedAt: null },
    _count: { id: true },
  });
  const leadsByCity = await prisma.lead.groupBy({
    by: ["purchaseRegion"],
    where: {
      purchaseRegion: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
    },
    _count: { id: true },
  });
  const leadMap = new Map<string, number>();
  for (const l of leadsByCity) {
    if (l.purchaseRegion) leadMap.set(l.purchaseRegion.trim().toLowerCase(), l._count.id);
  }

  const out: { regionKey: string; severity: GrowthSignalSeverity; context: Record<string, unknown> }[] = [];
  for (const r of rows) {
    const city = (r.city ?? "").trim().toLowerCase();
    if (!city) continue;
    const supply = r._count.id;
    const demand = leadMap.get(city) ?? 0;
    if (demand >= 8 && supply <= 3) {
      out.push({
        regionKey: city,
        severity: demand >= 15 ? "high" : "medium",
        context: { buyerLeads30d: demand, activeFsboListings: supply },
      });
    }
  }
  return out.slice(0, 20);
}

async function loadBrokerConversionGap(): Promise<
  { brokerUserId: string; severity: GrowthSignalSeverity; context: Record<string, unknown> }[]
> {
  const since = new Date(Date.now() - 30 * 86400000);
  const grouped = await prisma.lead.groupBy({
    by: ["introducedByBrokerId"],
    where: {
      introducedByBrokerId: { not: null },
      createdAt: { gte: since },
    },
    _count: { id: true },
  });
  const won = await prisma.lead.groupBy({
    by: ["introducedByBrokerId"],
    where: {
      introducedByBrokerId: { not: null },
      pipelineStatus: { in: ["won", "negotiation", "qualified"] },
      createdAt: { gte: since },
    },
    _count: { id: true },
  });
  const wonMap = new Map(won.map((w) => [w.introducedByBrokerId!, w._count.id]));

  const out: { brokerUserId: string; severity: GrowthSignalSeverity; context: Record<string, unknown> }[] = [];
  for (const g of grouped) {
    const bid = g.introducedByBrokerId!;
    const total = g._count.id;
    if (total < 10) continue;
    const progressed = wonMap.get(bid) ?? 0;
    const rate = progressed / total;
    if (rate < 0.08) {
      out.push({
        brokerUserId: bid,
        severity: rate < 0.03 ? "high" : "medium",
        context: {
          leads30d: total,
          progressedPipeline: progressed,
          approxProgressRate: Math.round(rate * 1000) / 10,
        },
      });
    }
  }
  return out.slice(0, 25);
}

async function loadBnhubOccupancyGap(): Promise<{ listingId: string; context: Record<string, unknown> }[]> {
  const thirty = new Date(Date.now() - 30 * 86400000);
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "ACTIVE",
      aiDiscoveryScore: { not: null },
    },
    select: {
      id: true,
      aiDiscoveryScore: true,
      bnhubListingCompletedStays: true,
      city: true,
    },
    take: 120,
    orderBy: { bnhubListingCompletedStays: "asc" },
  });

  const bookingCounts = await prisma.booking.groupBy({
    by: ["listingId"],
    where: {
      createdAt: { gte: thirty },
      listingId: { not: null },
    },
    _count: { id: true },
  });
  const bc = new Map(bookingCounts.map((b) => [b.listingId!, b._count.id]));

  const out: { listingId: string; context: Record<string, unknown> }[] = [];
  for (const L of listings) {
    const b30 = bc.get(L.id) ?? 0;
    if ((L.aiDiscoveryScore ?? 0) >= 55 && b30 <= 1) {
      out.push({
        listingId: L.id,
        context: {
          aiDiscoveryScore: L.aiDiscoveryScore,
          bookingsLast30d: b30,
          completedStaysLifetime: L.bnhubListingCompletedStays,
          city: L.city,
          heuristic: "demand_score_high_stays_low",
        },
      });
    }
  }
  return out.slice(0, 30);
}
