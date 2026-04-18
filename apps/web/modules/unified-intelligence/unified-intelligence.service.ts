/**
 * Listing-level unified intelligence — routes Syria through regional adapter only (read-only).
 */
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import {
  buildRegionListingKey,
  buildRegionListingRef,
  DEFAULT_WEB_REGION_CODE,
  parseRegionListingKey,
} from "@/modules/integrations/regions/region-listing-key.service";
import type { RegionListingSource } from "@/modules/integrations/regions/region-listing-key.types";
import {
  getBookingStats,
  getListingById as syriaGetListingBundle,
  SYRIA_REGION_CODE,
} from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { getSyriaCapabilityNotes } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import type {
  ListingSourceAvailability,
  UnifiedListingIntelligence,
  UnifiedListingSource,
} from "./unified-intelligence.types";

export type GetUnifiedListingIntelligenceParams = {
  listingId?: string;
  /** Wire-format key `{regionCode}:{source}:{listingId}` — parsed when `FEATURE_REGION_LISTING_KEY_V1` is on. */
  regionListingKey?: string;
  /** When omitted, resolves web CRM `Listing` row only — Syria requires explicit `syria`. */
  source?: UnifiedListingSource;
  regionCode?: string;
};

function emptyBookingCounts(): UnifiedListingIntelligence["bookingCounts"] {
  return {
    total: 0,
    fraudBookings: 0,
    guestPaid: 0,
    payoutPending: 0,
    payoutPaid: 0,
    cancelled: 0,
  };
}

function norm(s: string | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

function resolveRegionListingRef(params: {
  listingId: string;
  source: UnifiedListingSource;
  regionCode?: string;
}): UnifiedListingIntelligence["regionListingRef"] {
  if (!engineFlags.regionListingKeyV1 || !params.listingId) return null;
  const rc =
    params.regionCode ??
    (params.source === "syria"
      ? SYRIA_REGION_CODE
      : params.source === "web"
        ? DEFAULT_WEB_REGION_CODE
        : norm(params.regionCode) || "ext");
  const key = buildRegionListingKey({
    regionCode: rc,
    source: params.source as RegionListingSource,
    listingId: params.listingId,
  });
  return buildRegionListingRef(key);
}

function finalize(
  intel: Omit<UnifiedListingIntelligence, "regionListingRef">,
  refParams: { listingId: string; source: UnifiedListingSource; regionCode?: string },
): UnifiedListingIntelligence {
  const cap = intel.source === "syria" ? [...getSyriaCapabilityNotes()] : [];
  const availabilityNotes = [...intel.availabilityNotes];
  for (const n of cap) {
    if (!availabilityNotes.includes(n)) availabilityNotes.push(n);
  }
  return {
    ...intel,
    availabilityNotes,
    regionListingRef: resolveRegionListingRef(refParams),
  };
}

export async function getUnifiedListingIntelligence(
  params: GetUnifiedListingIntelligenceParams,
): Promise<UnifiedListingIntelligence> {
  let listingId = norm(params.listingId);
  let source: UnifiedListingSource = params.source ?? "web";
  let explicitRegionCode = params.regionCode;

  const notes: string[] = [];

  if (engineFlags.regionListingKeyV1 && params.regionListingKey) {
    const parsed = parseRegionListingKey(params.regionListingKey);
    if (parsed.key) {
      listingId = parsed.key.listingId;
      source = parsed.key.source as UnifiedListingSource;
      explicitRegionCode = parsed.key.regionCode;
    } else if (parsed.fallbackNote) {
      notes.push(parsed.fallbackNote);
    }
  }

  if (!listingId) {
    return finalize(
      {
        listingId: "",
        source,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["listing_id_missing"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "missing", syria: "missing" },
        availabilityNotes: [...notes, "listing_id_missing"],
      },
      { listingId: "", source, regionCode: explicitRegionCode },
    );
  }

  if (source === "syria") {
    if (!engineFlags.syriaRegionAdapterV1) {
      return finalize(
        {
          listingId,
          source: "syria",
          regionCode: SYRIA_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: emptyBookingCounts(),
          payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: [] },
          syriaRegionSummaryAttached: false,
          sourceStatus: { syria: "missing" },
          availabilityNotes: [...notes, "syria_region_adapter_disabled"],
        },
        { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
      );
    }

    const { listing, availabilityNotes } = await syriaGetListingBundle(listingId);
    const statsRes = await getBookingStats(listingId);
    const s = statsRes.data;
    const bc = s
      ? {
          total: s.bookingCount,
          fraudBookings: s.bookingsWithFraudFlag,
          guestPaid: s.guestPaidCount,
          payoutPending: s.payoutPendingCount,
          payoutPaid: s.payoutPaidCount,
          cancelled: s.cancelledCount,
        }
      : emptyBookingCounts();

    if (!listing) {
      return finalize(
        {
          listingId,
          source: "syria",
          regionCode: SYRIA_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: bc,
          payoutPipeline: {
            pendingHint: s?.payoutPendingCount ?? 0,
            paidHint: s?.payoutPaidCount ?? 0,
            approvedHint: 0,
            notes: [],
          },
          syriaRegionSummaryAttached: false,
          sourceStatus: { syria: "missing" },
          availabilityNotes: [...notes, ...availabilityNotes, ...statsRes.availabilityNotes],
        },
        { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
      );
    }

    return finalize(
      {
        listingId,
        source: "syria",
        regionCode: SYRIA_REGION_CODE,
        priceHint: listing.price,
        currencyHint: listing.currency,
        statusHint: listing.status,
        fraudFlag: listing.fraudFlag,
        featuredHint: listing.isFeatured,
        bookingCounts: bc,
        payoutPipeline: {
          pendingHint: s?.payoutPendingCount ?? 0,
          paidHint: s?.payoutPaidCount ?? 0,
          approvedHint: 0,
          notes: s ? [] : ["syria_booking_stats_unavailable"],
        },
        syriaRegionSummaryAttached: false,
        sourceStatus: { syria: "available" },
        availabilityNotes: [...notes, ...availabilityNotes, ...statsRes.availabilityNotes],
      },
      { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
    );
  }

  if (source === "external") {
    return finalize(
      {
        listingId,
        source: "external",
        regionCode: explicitRegionCode,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["external_source_not_resolved"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: {},
        availabilityNotes: [...notes, "external_listing_intel_not_configured"],
      },
      { listingId, source: "external", regionCode: explicitRegionCode },
    );
  }

  /** Default web CRM listing — minimal read-only projection (no Québec legal binding). */
  try {
    const row = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        price: true,
        title: true,
        listingCode: true,
        commissionCategory: true,
        updatedAt: true,
      },
    });
    if (!row) {
      notes.push("web_listing_not_found");

      let syHint = { listing: null as null, availabilityNotes: [] as string[] };
      if (engineFlags.syriaRegionAdapterV1) {
        syHint = await syriaGetListingBundle(listingId);
      }

      let syriaAvail: ListingSourceAvailability = "missing";
      if (engineFlags.syriaRegionAdapterV1 && syHint.listing) syriaAvail = "available";

      const amb: string[] = [];
      if (syHint.listing) {
        amb.push("same_id_exists_in_syria_namespace_use_explicit_source_syria_or_region_listing_key");
      }
      if (engineFlags.regionListingKeyV1 && syHint.listing) {
        amb.push("plain_listing_id_ambiguous_across_regions");
      }

      return finalize(
        {
          listingId,
          source: "web",
          regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: emptyBookingCounts(),
          payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: [] },
          syriaRegionSummaryAttached: false,
          sourceStatus: {
            web: "missing",
            ...(engineFlags.syriaRegionAdapterV1 ? { syria: syriaAvail } : {}),
          },
          availabilityNotes: [
            ...notes,
            ...amb,
            ...(engineFlags.syriaRegionAdapterV1 ? syHint.availabilityNotes : []),
          ],
        },
        { listingId, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
      );
    }

    const collisionNotes: string[] = [];
    if (engineFlags.syriaRegionAdapterV1 && engineFlags.regionListingKeyV1) {
      const syOnly = await syriaGetListingBundle(listingId);
      if (syOnly.listing) {
        collisionNotes.push("listing_id_collision_web_crm_and_syria_resolve_with_region_listing_key");
      }
    }

    return finalize(
      {
        listingId: row.id,
        source: "web",
        regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
        priceHint: typeof row.price === "number" ? row.price : null,
        currencyHint: "CAD",
        statusHint: row.commissionCategory,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: {
          pendingHint: 0,
          paidHint: 0,
          approvedHint: 0,
          notes: ["web_booking_agg_not_attached_to_crm_listing"],
        },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "available" },
        availabilityNotes: [...notes, ...collisionNotes, "crm_listing_minimal_intel_only"],
      },
      { listingId: row.id, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
    );
  } catch {
    return finalize(
      {
        listingId,
        source: "web",
        regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["web_read_failed"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "missing" },
        availabilityNotes: [...notes, "web_listing_read_failed"],
      },
      { listingId, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
    );
  }
}
