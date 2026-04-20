/**
 * Read-only preview signals derived from observed listing metrics — no writes, no detectors.
 */

import { createHash } from "crypto";
import { buildListingObservationSnapshot } from "./observation-builder";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type {
  BookingConversionSignal,
  ListingPerformanceSignal,
  MarketplaceSignal,
  ObservationSnapshot,
} from "../types/domain.types";
import {
  PREVIEW_HEALTHY_BOOKINGS_MIN,
  PREVIEW_HEALTHY_CONVERSION_MIN,
  PREVIEW_HEALTHY_VIEWS_MIN,
  PREVIEW_LOW_BOOKINGS_MAX,
  PREVIEW_LOW_VIEWS_MAX,
  PREVIEW_WEAK_CONVERSION_MAX,
} from "./preview-signal-thresholds";

const SOURCE = "preview.listing_metrics";

export function previewStableSignalId(listingId: string, code: string): string {
  const h = createHash("sha256").update(`${listingId}|${code}`).digest("hex").slice(0, 22);
  return `preview-sig-${h}`;
}

/** Codes emitted by `buildPreviewSignalsForListing` — used for deterministic downstream mapping. */
export const PREVIEW_METRIC_SIGNAL_CODES = [
  "low_views",
  "healthy_views",
  "low_booking_interest",
  "healthy_booking_interest",
  "weak_conversion_proxy",
  "healthy_conversion_proxy",
  "inactive_listing",
  "active_listing",
  "missing_price",
  "price_present",
] as const;

export type PreviewMetricSignalCode = (typeof PREVIEW_METRIC_SIGNAL_CODES)[number];

export function collectPreviewMetricCodes(
  listingId: string,
  signals: MarketplaceSignal[],
): Set<PreviewMetricSignalCode> {
  const found = new Set<PreviewMetricSignalCode>();
  for (const code of PREVIEW_METRIC_SIGNAL_CODES) {
    const id = previewStableSignalId(listingId, code);
    if (signals.some((s) => s.id === id)) {
      found.add(code);
    }
  }
  return found;
}

function lpSignal(input: Omit<ListingPerformanceSignal, "signalType">): ListingPerformanceSignal {
  return { ...input, signalType: "listing_performance" };
}

function bkSignal(input: Omit<BookingConversionSignal, "signalType">): BookingConversionSignal {
  return { ...input, signalType: "booking_conversion" };
}

/**
 * Builds deterministic marketplace signals from real observed metrics only.
 */
export async function buildPreviewSignalsForListing(
  listingId: string,
  observation: ObservationSnapshot,
): Promise<MarketplaceSignal[]> {
  const acc: MarketplaceSignal[] = [];
  try {
    let snap: ListingObservationSnapshot | null =
      observation.facts?.metrics != null && typeof observation.facts.metrics === "object"
        ? (observation.facts.metrics as ListingObservationSnapshot)
        : null;
    if (!snap) {
      snap = await buildListingObservationSnapshot(listingId);
    }
    if (!snap) {
      return [];
    }

    const observedAt = observation.builtAt ?? new Date().toISOString();
    const views = snap.views ?? 0;
    const bookings = snap.bookings ?? 0;
    const conversionRate = snap.conversionRate ?? 0;
    const status = String(snap.listingStatus ?? "").toUpperCase();
    const price = snap.price;

    const metaBase = {
      listingId,
      views,
      conversionRate,
    };

    if (views <= PREVIEW_LOW_VIEWS_MAX) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "low_views"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Observed views are below the preview visibility band.",
          metadata: { ...metaBase },
        }),
      );
    } else if (views >= PREVIEW_HEALTHY_VIEWS_MIN) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "healthy_views"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Observed views meet or exceed the healthy preview visibility band.",
          metadata: { ...metaBase },
        }),
      );
    }

    if (bookings <= PREVIEW_LOW_BOOKINGS_MAX) {
      acc.push(
        bkSignal({
          id: previewStableSignalId(listingId, "low_booking_interest"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Booking-style interest signals are in the low preview band.",
          metadata: {
            listingId,
            bookingsStarted: bookings,
          },
        }),
      );
    } else if (bookings >= PREVIEW_HEALTHY_BOOKINGS_MIN) {
      acc.push(
        bkSignal({
          id: previewStableSignalId(listingId, "healthy_booking_interest"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Booking-style interest signals are in the healthy preview band.",
          metadata: {
            listingId,
            bookingsStarted: bookings,
          },
        }),
      );
    }

    if (conversionRate < PREVIEW_WEAK_CONVERSION_MAX) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "weak_conversion_proxy"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Conversion proxy ratio is below the preview healthy band.",
          metadata: { ...metaBase },
        }),
      );
    } else if (conversionRate >= PREVIEW_HEALTHY_CONVERSION_MIN) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "healthy_conversion_proxy"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Conversion proxy ratio meets the preview healthy band.",
          metadata: { ...metaBase },
        }),
      );
    }

    const inactive =
      status === "DRAFT" || status === "ARCHIVED" || status === "SUSPENDED" || status === "UNPUBLISHED";
    if (inactive) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "inactive_listing"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Listing status indicates limited public marketplace exposure in preview.",
          metadata: { ...metaBase },
        }),
      );
    } else if (status === "PUBLISHED" || status === "ACTIVE" || status === "LIVE") {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "active_listing"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Listing status indicates active marketplace exposure in preview.",
          metadata: { ...metaBase },
        }),
      );
    }

    const priceMissing = price === null || price === undefined || price <= 0;
    if (priceMissing) {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "missing_price"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Price is missing or zero in the observed snapshot.",
          metadata: { ...metaBase },
        }),
      );
    } else {
      acc.push(
        lpSignal({
          id: previewStableSignalId(listingId, "price_present"),
          observedAt,
          source: SOURCE,
          confidence: 1,
          explanation: "Price is present in the observed snapshot.",
          metadata: { ...metaBase },
        }),
      );
    }

    return acc.sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}
