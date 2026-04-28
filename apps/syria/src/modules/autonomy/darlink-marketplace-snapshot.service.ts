/**
 * Unified marketplace snapshot — read-only Prisma aggregates; deterministic; never throws (returns safe empty snapshot).
 */

import type { SyriaPropertyStatus, SyriaPropertyType } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { analyzeListingQuality } from "@/lib/listing-quality";
import type {
  DarlinkBookingSnapshotRow,
  DarlinkGrowthMetricsSnapshot,
  DarlinkLeadSnapshotRow,
  DarlinkListingSnapshotRow,
  DarlinkMarketplaceSnapshot,
  DarlinkPayoutSnapshotRow,
} from "./darlink-marketplace-autonomy.types";

const STALE_DAYS = 90;
const SNAPSHOT_LISTING_CAP = 80;
const SNAPSHOT_BOOKING_CAP = 120;

function iso(d: Date): string {
  return d.toISOString();
}

function decToString(v: { toString(): string } | null | undefined): string {
  try {
    return v != null ? v.toString() : "0";
  } catch {
    return "0";
  }

}

function emptySnapshot(notes: readonly string[]): DarlinkMarketplaceSnapshot {
  const now = new Date().toISOString();
  return {
    builtAt: now,
    scope: { mode: "portfolio", listingId: null },
    listings: [],
    bookings: [],
    payouts: [],
    leads: [],
    aggregates: {
      totalListings: 0,
      pendingReviewListings: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      stalePublishedLikeCount: 0,
      totalBookings: 0,
      payoutsPending: 0,
      payoutsPaid: 0,
      inquiriesLast30d: 0,
      activeBnhubListings: 0,
    },
    trustHints: { fraudListedCount: 0, fraudBookingCount: 0 },
    rankingHints: { avgFeaturedPriority: 0 },
    growthMetrics: null,
    executionRecent: [],
    autopilotRecommendationsPending: 0,
    notes,
  };
}

export type BuildMarketplaceSnapshotParams = {
  listingId?: string | null;
  /** When true and no listingId — portfolio aggregates. */
  portfolio?: boolean;
};

export async function buildMarketplaceSnapshot(params: BuildMarketplaceSnapshotParams): Promise<DarlinkMarketplaceSnapshot> {
  try {
    const builtAt = new Date().toISOString();
    const notes: string[] = [];
    const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000);

    const listingId = typeof params.listingId === "string" ? params.listingId.trim() : "";

    let listingsRaw: {
      id: string;
      status: SyriaPropertyStatus;
      type: SyriaPropertyType;
      fraudFlag: boolean;
      price: { toString(): string };
      city: string;
      isFeatured: boolean;
      featuredPriority: number;
      updatedAt: Date;
      createdAt: Date;
      titleAr: string;
      titleEn: string | null;
      descriptionAr: string;
      descriptionEn: string | null;
      images: string[];
      amenities: string[];
      verified: boolean;
    }[] = [];

    const windowStart = new Date(Date.now() - 30 * 86400000);

    const [
      totalListings,
      pendingReviewListings,
      featuredListings,
      fraudFlaggedListings,
      stalePublishedLikeCount,
      totalBookings,
      payoutsPending,
      payoutsPaid,
      inquiriesLast30d,
      activeBnhubListings,
      fraudBookingAgg,
      growthRows,
      execRows,
      autopilotPending,
    ] = await Promise.all([
      prisma.syriaProperty.count().catch(() => 0),
      prisma.syriaProperty.count({ where: { status: { in: ["PENDING_REVIEW", "NEEDS_REVIEW"] } } }).catch(() => 0),
      prisma.syriaProperty.count({ where: { isFeatured: true } }).catch(() => 0),
      prisma.syriaProperty.count({ where: { fraudFlag: true } }).catch(() => 0),
      prisma.syriaProperty
        .count({
          where: {
            status: "PUBLISHED",
            updatedAt: { lt: staleCutoff },
          },
        })
        .catch(() => 0),
      prisma.syriaBooking.count().catch(() => 0),
      prisma.syriaPayout.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.syriaPayout.count({ where: { status: "PAID" } }).catch(() => 0),
      prisma.syriaInquiry.count({ where: { createdAt: { gte: windowStart } } }).catch(() => 0),
      prisma.syriaProperty.count({ where: { type: "BNHUB", status: "PUBLISHED" } }).catch(() => 0),
      prisma.syriaBooking.count({ where: { fraudFlag: true } }).catch(() => 0),
      prisma.syriaGrowthEvent
        .groupBy({
          by: ["eventType"],
          where: { createdAt: { gte: windowStart } },
          _count: { id: true },
        })
        .catch(() => [] as { eventType: string; _count: { id: number } }[]),
      prisma.syriaMarketplaceAutonomyActionRecord
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { actionType: true, outcome: true, createdAt: true },
        })
        .catch(() => []),
      prisma.syriaAutonomyRecommendation.count({ where: { status: "PENDING" } }).catch(() => 0),
    ]);

    const eventsByType: Record<string, number> = {};
    for (const r of growthRows) {
      eventsByType[r.eventType] = r._count.id;
    }
    const growthMetrics: DarlinkGrowthMetricsSnapshot = {
      windowStart: iso(windowStart),
      eventsByType,
    };

    if (listingId) {
      const one = await prisma.syriaProperty
        .findUnique({
          where: { id: listingId },
          select: {
            id: true,
            status: true,
            type: true,
            fraudFlag: true,
            price: true,
            city: true,
            isFeatured: true,
            featuredPriority: true,
            updatedAt: true,
            createdAt: true,
            titleAr: true,
            titleEn: true,
            descriptionAr: true,
            descriptionEn: true,
            images: true,
            amenities: true,
            verified: true,
          },
        })
        .catch(() => null);
      if (one) listingsRaw = [one];
      else notes.push("snapshot_listing_not_found");
    } else {
      listingsRaw = await prisma.syriaProperty
        .findMany({
          take: SNAPSHOT_LISTING_CAP,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            status: true,
            type: true,
            fraudFlag: true,
            price: true,
            city: true,
            isFeatured: true,
            featuredPriority: true,
            updatedAt: true,
            createdAt: true,
            titleAr: true,
            titleEn: true,
            descriptionAr: true,
            descriptionEn: true,
            images: true,
            amenities: true,
            verified: true,
          },
        })
        .catch(() => []);
    }

    const listings: DarlinkListingSnapshotRow[] = [];
    for (const p of listingsRaw) {
      let qualityScoreApprox: number | null = null;
      try {
        qualityScoreApprox = analyzeListingQuality({
          titleAr: p.titleAr,
          titleEn: p.titleEn,
          descriptionAr: p.descriptionAr,
          descriptionEn: p.descriptionEn,
          images: p.images,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          city: p.city,
        }).score;
      } catch {
        qualityScoreApprox = null;
      }
      listings.push({
        id: p.id,
        status: p.status,
        type: p.type,
        fraudFlag: p.fraudFlag,
        price: decToString(p.price),
        city: p.city,
        isFeatured: p.isFeatured,
        featuredPriority: p.featuredPriority,
        updatedAt: iso(p.updatedAt),
        createdAt: iso(p.createdAt),
        qualityScoreApprox,
      });
    }

    const listingIds = listings.map((l) => l.id);
    const bookingWhere =
      listingId ?
        { propertyId: listingId }
      : listingIds.length > 0 ?
        { propertyId: { in: listingIds } }
      : undefined;

    let bookingsRaw: {
      id: string;
      propertyId: string;
      status: string;
      guestPaymentStatus: string;
      payoutStatus: string;
      fraudFlag: boolean;
      totalPrice: { toString(): string };
      checkedInAt: Date | null;
      checkIn: Date;
      createdAt: Date;
    }[] = [];

    if (bookingWhere) {
      bookingsRaw = await prisma.syriaBooking
        .findMany({
          where: bookingWhere,
          take: SNAPSHOT_BOOKING_CAP,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            propertyId: true,
            status: true,
            guestPaymentStatus: true,
            payoutStatus: true,
            fraudFlag: true,
            totalPrice: true,
            checkedInAt: true,
            checkIn: true,
            createdAt: true,
          },
        })
        .catch(() => []);
    }

    const bookings: DarlinkBookingSnapshotRow[] = bookingsRaw.map((b) => ({
      id: b.id,
      propertyId: b.propertyId,
      status: b.status,
      guestPaymentStatus: b.guestPaymentStatus,
      payoutStatus: b.payoutStatus,
      fraudFlag: b.fraudFlag,
      totalPrice: decToString(b.totalPrice),
      checkedInAt: b.checkedInAt ? iso(b.checkedInAt) : null,
      checkIn: iso(b.checkIn),
      createdAt: iso(b.createdAt),
    }));

    const bookingIds = bookings.map((b) => b.id);
    let payoutsRaw: {
      id: string;
      bookingId: string;
      hostId: string;
      status: string;
      amount: { toString(): string };
      currency: string;
    }[] = [];
    if (bookingIds.length > 0) {
      payoutsRaw = await prisma.syriaPayout
        .findMany({
          where: { bookingId: { in: bookingIds } },
          select: {
            id: true,
            bookingId: true,
            hostId: true,
            status: true,
            amount: true,
            currency: true,
          },
        })
        .catch(() => []);
    }

    const payouts: DarlinkPayoutSnapshotRow[] = payoutsRaw.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      hostId: p.hostId,
      status: p.status,
      amount: decToString(p.amount),
      currency: p.currency,
    }));

    let leadsRaw: { id: string; propertyId: string; createdAt: Date }[] = [];
    try {
      leadsRaw = await prisma.syriaInquiry.findMany({
        where:
          listingId ?
            { propertyId: listingId }
          : listingIds.length > 0 ?
            { propertyId: { in: listingIds } }
          : {},
        take: 200,
        orderBy: { createdAt: "desc" },
        select: { id: true, propertyId: true, createdAt: true },
      });
    } catch {
      leadsRaw = [];
    }

    const leads: DarlinkLeadSnapshotRow[] = leadsRaw.map((x) => ({
      id: x.id,
      propertyId: x.propertyId,
      createdAt: iso(x.createdAt),
    }));

    let avgFeaturedPriority = 0;
    if (listings.length > 0) {
      avgFeaturedPriority =
        listings.reduce((s, l) => s + l.featuredPriority, 0) / listings.length;
    }

    const executionRecent = execRows.map((r) => ({
      actionType: r.actionType,
      outcome: String(r.outcome),
      createdAt: iso(r.createdAt),
    }));

    return {
      builtAt,
      scope:
        listingId ?
          { mode: "listing", listingId }
        : { mode: "portfolio", listingId: null },
      listings,
      bookings,
      payouts,
      leads,
      aggregates: {
        totalListings,
        pendingReviewListings,
        featuredListings,
        fraudFlaggedListings,
        stalePublishedLikeCount,
        totalBookings,
        payoutsPending,
        payoutsPaid,
        inquiriesLast30d,
        activeBnhubListings,
      },
      trustHints: {
        fraudListedCount: fraudFlaggedListings,
        fraudBookingCount: fraudBookingAgg,
      },
      rankingHints: {
        avgFeaturedPriority: Math.round(avgFeaturedPriority * 100) / 100,
      },
      growthMetrics,
      executionRecent,
      autopilotRecommendationsPending: autopilotPending,
      notes,
    };
  } catch {
    return emptySnapshot(["snapshot_build_failed"]);
  }
}
