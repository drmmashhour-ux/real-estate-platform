/**
 * Read-only Syria listing preview inputs for the autonomous marketplace preview pipeline.
 * Uses `syria_*` tables via `syria-region-adapter` only — no writes, no `app/syria` imports.
 */
import { engineFlags } from "@/config/feature-flags";
import type { ObservationSnapshot } from "@/modules/autonomous-marketplace/types/domain.types";
import type { ListingObservationSnapshot } from "@/modules/autonomous-marketplace/types/listing-observation-snapshot.types";
import { aggregateSignalsForTarget, normalizeListingSignals, safeNormalize } from "@/modules/autonomous-marketplace/signals/signal-normalizer";
import type { DomainTarget } from "@/modules/autonomous-marketplace/types/domain.types";
import { getBookingStats, getListingById, SYRIA_REGION_CODE } from "./syria-region-adapter.service";

function emptyMetrics(_listingId: string): ListingObservationSnapshot {
  return {
    views: 0,
    bookings: 0,
    conversionRate: 0,
    price: 0,
    listingStatus: "UNKNOWN",
  };
}

/** Normalized facts for preview explainability / policy context (no FSBO cents semantics). */
export function buildSyriaListingPreviewFacts(listingId: string): Record<string, unknown> {
  const id = typeof listingId === "string" ? listingId.trim() : "";
  const out: Record<string, unknown> = {
    regionCode: SYRIA_REGION_CODE,
    source: "syria",
    previewScope: "syria_read_adapter",
    listingId: id || null,
  };
  return out;
}

function daysSinceIso(iso: string | null | undefined): number | null {
  if (!iso || typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 86400000);
}

function newSyriaSnapshot(target: DomainTarget, signals: ObservationSnapshot["signals"], facts: Record<string, unknown>): ObservationSnapshot {
  const builtAt = typeof facts.builtAt === "string" ? facts.builtAt : new Date().toISOString();
  return {
    id: `obs-syria-${target.id ?? "unknown"}-${builtAt}`,
    target,
    signals,
    aggregates: aggregateSignalsForTarget(signals),
    facts: { ...facts, builtAt },
    builtAt,
  };
}

/**
 * Builds an observation aligned with the preview detector registry (still fsbo-oriented);
 * detectors return empty for non-`fsbo_listing` targets — callers append availability notes instead of failing.
 */
export async function buildSyriaListingObservationSnapshot(listingId: string): Promise<{
  observation: ObservationSnapshot | null;
  metrics: ListingObservationSnapshot | null;
  facts: Record<string, unknown>;
  availabilityNotes: string[];
}> {
  const id = typeof listingId === "string" ? listingId.trim() : "";
  const notes: string[] = [];

  if (!id) {
    return {
      observation: null,
      metrics: null,
      facts: buildSyriaListingPreviewFacts(""),
      availabilityNotes: ["syria_preview_listing_id_missing"],
    };
  }

  if (!engineFlags.syriaRegionAdapterV1) {
    return {
      observation: null,
      metrics: null,
      facts: { ...buildSyriaListingPreviewFacts(id), adapterDisabled: true },
      availabilityNotes: [...notes, "syria_region_adapter_disabled"],
    };
  }

  try {
    const { listing, availabilityNotes: lNotes } = await getListingById(id);
    const statsRes = await getBookingStats(id);
    notes.push(...lNotes, ...statsRes.availabilityNotes);

    const stats = statsRes.data;
    const bookings = stats?.bookingCount ?? listing?.bookingCountHint ?? 0;

    const metrics: ListingObservationSnapshot = listing
      ? {
          views: 0,
          bookings,
          conversionRate: 0,
          price: typeof listing.price === "number" ? listing.price : 0,
          listingStatus: listing.status,
        }
      : emptyMetrics(id);

    const builtAt = new Date().toISOString();
    const title = listing?.title ?? "";
    const label = title ? title.slice(0, 120) : `syria-listing-${id}`;

    const listingSigs = safeNormalize(
      () =>
        normalizeListingSignals({
          listingId: id,
          views: 0,
          saves: 0,
          contacts: bookings,
          conversionRate: 0,
          daysOnMarket: 0,
          titleLen: title.length,
          descriptionLen: listing?.description?.length ?? 0,
          photoCount: 0,
          amenitiesScore: 0,
          source: "syria.region.preview",
        }),
      "listing",
    );

    const target: DomainTarget = { type: "syria_listing", id, label };
    const previewFacts = buildSyriaListingPreviewFacts(id);
    const facts: Record<string, unknown> = {
      ...previewFacts,
      builtAt,
      syriaListingStatus: listing?.status ?? null,
      fraudFlag: listing?.fraudFlag ?? null,
      isFeatured: listing?.isFeatured ?? null,
      currency: listing?.currency ?? null,
      priceMajorUnits: listing?.price ?? null,
      /** Explicit: Syria prices are not `fsbo_listings.priceCents`. */
      priceSemantics: "syria_major_currency_units",
      bookingStats: stats
        ? {
            bookingCount: stats.bookingCount,
            fraudBookings: stats.bookingsWithFraudFlag,
            guestPaid: stats.guestPaidCount,
            payoutPending: stats.payoutPendingCount,
            payoutPaid: stats.payoutPaidCount,
            cancelled: stats.cancelledCount,
          }
        : null,
      payoutStateHint: listing?.payoutStateHint ?? null,
      preview: true,
      dryRunOnly: true,
      detectorsFsboOnlyNote: "preview_detectors_require_fsbo_listing_target_syria_returns_empty_opportunities",
      /** Only when listing row exists — drives `listing_stale` signal; do not synthesize views. */
      daysSinceListingUpdate: listing ? daysSinceIso(listing.updatedAt) : null,
    };

    if (!listing) {
      notes.push("syria_listing_not_found_for_preview");
    }

    const observation = newSyriaSnapshot(target, listingSigs, facts);

    return {
      observation,
      metrics: listing ? metrics : null,
      facts,
      availabilityNotes: notes,
    };
  } catch {
    return {
      observation: null,
      metrics: null,
      facts: { ...buildSyriaListingPreviewFacts(id), readFailed: true },
      availabilityNotes: [...notes, "syria_preview_observation_build_failed"],
    };
  }
}
