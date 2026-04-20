/**
 * Syria regional adapter façade — wraps `syria/` isolated implementation; maps to shared platform types.
 * Does not import apps/syria directly; uses existing web-side read adapters only.
 */
import type { NormalizedBooking, NormalizedListing, NormalizedUserProfile } from "@lecipm/platform-core";
import {
  getBookingStats,
  getListingById,
  getUserProfile,
  listListingsSummary,
  syriaRegionAdapter,
  SYRIA_REGION_CODE,
} from "./syria/syria-region-adapter.service";
import type { SyriaBookingStatsRead } from "./syria/syria-read-adapter.service";
import type { SyriaNormalizedFlaggedListing } from "./syria/syria-normalizer.service";
import type { SyriaNormalizedListing, SyriaNormalizedUser } from "./syria/syria-region.types";

export { SYRIA_REGION_CODE };

function nn(...n: string[]): readonly string[] {
  return n;
}

export function syriaNormalizedToPlatformListing(row: SyriaNormalizedListing | null): NormalizedListing | null {
  if (!row) return null;
  return {
    id: row.id,
    sourceApp: "syria",
    regionCode: "sy",
    listingType: row.listingType,
    title: row.title,
    status: row.status,
    priceHint: row.price,
    currency: row.currency,
    complianceState: row.fraudFlag ? "pending" : "unknown",
    legalRiskScoreHint: null,
    trustScoreHint: null,
    fraudFlag: row.fraudFlag,
    bookingCountHint: row.bookingCountHint,
    revenueHint: null,
    payoutPendingHint: row.payoutStateHint === "pending_heavy" ? 1 : null,
    availabilityNotes: nn("syria_scope_properties_table"),
  };
}

export function flaggedToNormalizedListing(f: SyriaNormalizedFlaggedListing): NormalizedListing {
  return {
    id: f.id,
    sourceApp: "syria",
    regionCode: "sy",
    listingType: "risk_flagged_sample",
    title: f.title,
    status: null,
    priceHint: null,
    currency: "USD",
    complianceState: f.fraudFlag ? "pending" : "unknown",
    legalRiskScoreHint: f.riskScore,
    trustScoreHint: null,
    fraudFlag: f.fraudFlag,
    bookingCountHint: f.fraudBookingCount,
    revenueHint: null,
    payoutPendingHint: null,
    availabilityNotes: nn("syria_flagged_listings_sample_not_full_inventory"),
  };
}

export function syriaNormalizedToPlatformUser(row: SyriaNormalizedUser | null): NormalizedUserProfile | null {
  if (!row) return null;
  return {
    id: row.id,
    regionCode: "sy",
    sourceApp: "syria",
    roleHint: row.role,
    trustScoreHint: null,
    riskTags: row.hostPayoutsPending > 0 ? nn("payout_pending_nonzero") : nn(),
    availabilityNotes: nn("syria_user_projection"),
  };
}

export function syriaBookingStatsToNormalized(propertyId: string, stats: SyriaBookingStatsRead | null): NormalizedBooking | null {
  if (!stats) return null;
  return {
    id: `sy-stats:${propertyId}`,
    listingId: propertyId,
    regionCode: "sy",
    sourceApp: "syria",
    status: null,
    grossHint: stats.sumTotalPriceHint,
    fraudFlag: stats.bookingsWithFraudFlag > 0,
    cancelled: stats.cancelledCount > 0,
    availabilityNotes: nn("syria_aggregate_booking_stats"),
  };
}

async function getListingNormalized(listingId: string) {
  const res = await getListingById(listingId);
  const listing = syriaNormalizedToPlatformListing(res.listing as SyriaNormalizedListing | null);
  return { listing, availabilityNotes: res.availabilityNotes as readonly string[] };
}

async function listSummaryNormalized(limit = 24) {
  const flagged = await syriaRegionAdapter.listFlaggedListings(limit);
  const items = flagged.items.map(flaggedToNormalizedListing);
  return { items, availabilityNotes: flagged.availabilityNotes as readonly string[] };
}

export const syriaPlatformRegionAdapter = {
  regionCode: SYRIA_REGION_CODE,
  getListingById: getListingNormalized,
  listListingsSummary: listSummaryNormalized,
  getBookingStats,
  getUserProfile: async (userId: string) => {
    const r = await getUserProfile(userId);
    return {
      user: syriaNormalizedToPlatformUser(r.user as SyriaNormalizedUser | null),
      availabilityNotes: r.availabilityNotes as readonly string[],
    };
  },
  normalizeListing(raw: unknown): NormalizedListing | null {
    return syriaNormalizedToPlatformListing(raw as SyriaNormalizedListing | null);
  },
  normalizeBooking(raw: unknown): NormalizedBooking | null {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as { propertyId?: string; stats?: SyriaBookingStatsRead | null };
    const propertyId = typeof o.propertyId === "string" ? o.propertyId : "";
    if (!propertyId) return null;
    return syriaBookingStatsToNormalized(propertyId, o.stats ?? null);
  },
  /** Aggregate regional summary — passthrough */
  getRegionSummary: syriaRegionAdapter.getRegionSummary,
  listListingsSummaryAggregate: listListingsSummary,
  legacy: syriaRegionAdapter,
};

export type SyriaPlatformRegionAdapter = typeof syriaPlatformRegionAdapter;
