/**
 * Builds Syria preview signals from an observation snapshot — read-only, deterministic, no throws.
 * Does not invent metrics: listing view counts must appear in `facts.listingViewCount` to enable view-based signals.
 */
import type { ObservationSnapshot } from "@/modules/autonomous-marketplace/types/domain.types";
import {
  SYRIA_LOW_BOOKING_VS_VIEWS_MAX,
  SYRIA_MIN_BOOKINGS_MEANINGFUL,
  SYRIA_PAYOUT_PENDING_DOMINANCE,
  SYRIA_STALE_LISTING_DAYS,
  SYRIA_VIEW_HIGH_THRESHOLD,
} from "./syria-signal-thresholds";
import type { SyriaSignal, SyriaSignalType } from "./syria-signal.types";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

export function buildSyriaSignals(observation: ObservationSnapshot | null): SyriaSignal[] {
  if (!observation?.facts || typeof observation.facts !== "object") {
    return [];
  }

  const facts = observation.facts as Record<string, unknown>;
  const listingId =
    str(facts.listingId) ?? (observation.target?.id ? String(observation.target.id) : null) ?? "unknown";

  const signals: SyriaSignal[] = [];

  const push = (
    type: SyriaSignalType,
    severity: SyriaSignal["severity"],
    message: string,
    contributingMetrics: Record<string, number | string | null>,
  ) => {
    signals.push({ type, severity, message, contributingMetrics });
  };

  const statusRaw = str(facts.syriaListingStatus);
  const fraudFlag = bool(facts.fraudFlag);
  const bookingStats = facts.bookingStats && typeof facts.bookingStats === "object" ? (facts.bookingStats as Record<string, unknown>) : null;

  const bookingCount = bookingStats ? num(bookingStats.bookingCount) : null;
  const fraudBookings = bookingStats ? num(bookingStats.fraudBookings) : null;
  const payoutPending = bookingStats ? num(bookingStats.payoutPending) : null;
  const payoutPaid = bookingStats ? num(bookingStats.payoutPaid) : null;

  const payoutStateHint = str(facts.payoutStateHint);

  const daysSince = num(facts.daysSinceListingUpdate);
  const listingViewCount = facts.listingViewCount !== undefined ? num(facts.listingViewCount) : null;

  /** Non-published inventory states */
  if (statusRaw && statusRaw !== "PUBLISHED") {
    const inactiveStatuses = ["DRAFT", "REJECTED", "ARCHIVED"];
    if (inactiveStatuses.includes(statusRaw)) {
      push(
        "inactive_listing",
        "info",
        "Listing is not in a published active state.",
        {
          listingId,
          syriaListingStatus: statusRaw,
        },
      );
    }
    if (statusRaw === "PENDING_REVIEW") {
      push(
        "review_backlog",
        "warning",
        "Listing is awaiting admin review.",
        {
          listingId,
          syriaListingStatus: statusRaw,
        },
      );
    }
  }

  if (fraudFlag === true || (fraudBookings !== null && fraudBookings > 0)) {
    push(
      "potential_fraud_pattern",
      "critical",
      "Fraud flag or fraud-marked bookings present on listing.",
      {
        listingId,
        fraudFlag: fraudFlag === true ? 1 : 0,
        fraudBookings: fraudBookings ?? null,
      },
    );
  }

  if (bookingCount !== null && bookingCount < SYRIA_MIN_BOOKINGS_MEANINGFUL) {
    push(
      "low_booking_activity",
      bookingCount === 0 ? "warning" : "info",
      "Booking count is below meaningful activity threshold.",
      {
        listingId,
        bookingCount,
        thresholdMeaningful: SYRIA_MIN_BOOKINGS_MEANINGFUL,
      },
    );
  }

  /** listingViewCount must be explicitly provided in facts — no guessing from other fields. */
  if (
    listingViewCount !== null &&
    listingViewCount > SYRIA_VIEW_HIGH_THRESHOLD &&
    bookingCount !== null &&
    bookingCount <= SYRIA_LOW_BOOKING_VS_VIEWS_MAX
  ) {
    push(
      "low_conversion_high_views",
      "warning",
      "Reported views are high relative to booking volume.",
      {
        listingId,
        listingViewCount,
        bookingCount,
      },
    );
  }

  if (daysSince !== null && daysSince > SYRIA_STALE_LISTING_DAYS && statusRaw === "PUBLISHED") {
    push(
      "listing_stale",
      "info",
      "Listing record has not been updated recently.",
      {
        listingId,
        daysSinceListingUpdate: daysSince,
        staleDaysThreshold: SYRIA_STALE_LISTING_DAYS,
      },
    );
  }

  if (
    payoutPending !== null &&
    payoutPaid !== null &&
    payoutPending >= payoutPaid + SYRIA_PAYOUT_PENDING_DOMINANCE &&
    payoutPending > 0
  ) {
    push(
      "payout_anomaly",
      "warning",
      "Payout backlog dominates paid payouts for this listing context.",
      {
        listingId,
        payoutPending,
        payoutPaid,
      },
    );
  }

  if (payoutStateHint === "pending_heavy") {
    push(
      "payout_anomaly",
      "warning",
      "Payout state hint indicates heavy pending pipeline.",
      {
        listingId,
        payoutStateHint,
      },
    );
  }

  return dedupeSignalsByType(signals);
}

const SEV: Record<SyriaSignal["severity"], number> = { info: 1, warning: 2, critical: 3 };

function dedupeSignalsByType(signals: SyriaSignal[]): SyriaSignal[] {
  const byType = new Map<SyriaSignalType, SyriaSignal>();
  for (const s of signals) {
    const cur = byType.get(s.type);
    if (!cur || SEV[s.severity] > SEV[cur.severity]) {
      byType.set(s.type, s);
    }
  }
  return Array.from(byType.values());
}
