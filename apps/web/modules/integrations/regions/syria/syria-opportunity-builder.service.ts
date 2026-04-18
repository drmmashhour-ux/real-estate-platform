/**
 * Maps Syria signals to at most five advisory opportunities — read-only, no execution hooks.
 */
import type { SyriaOpportunity, SyriaSignal, SyriaSignalType } from "./syria-signal.types";

const BY_SEVERITY: Record<SyriaSignal["severity"], number> = { critical: 3, warning: 2, info: 1 };

/** Tie-break when severities match — deterministic global order. */
const TYPE_RANK: Record<SyriaSignalType, number> = {
  potential_fraud_pattern: 0,
  payout_anomaly: 1,
  review_backlog: 2,
  low_conversion_high_views: 3,
  low_booking_activity: 4,
  listing_stale: 5,
  inactive_listing: 6,
};

const COPY: Record<
  SyriaSignalType,
  { title: string; description: string; suggestedActions: string[] }
> = {
  low_conversion_high_views: {
    title: "Improve listing performance",
    description: "Reported views are elevated relative to booking volume for this listing.",
    suggestedActions: ["review pricing", "improve description", "check photos"],
  },
  low_booking_activity: {
    title: "Increase booking traction",
    description: "Booking volume is below the configured meaningful-activity threshold.",
    suggestedActions: ["review availability", "verify pricing", "confirm listing accuracy"],
  },
  potential_fraud_pattern: {
    title: "Review listing for risk",
    description: "Fraud markers or fraud-tagged bookings are present in the supplied metrics.",
    suggestedActions: ["manual admin review required"],
  },
  listing_stale: {
    title: "Listing appears inactive",
    description: "The listing record has not been updated recently while published.",
    suggestedActions: ["update listing", "review availability"],
  },
  payout_anomaly: {
    title: "Review payout indicators",
    description: "Payout pending versus paid counts or payout hints suggest an imbalance.",
    suggestedActions: ["review payout pipeline for this listing", "confirm booking settlement state"],
  },
  review_backlog: {
    title: "Clear review queue",
    description: "Listing is awaiting administrative review.",
    suggestedActions: ["complete moderation review", "verify listing meets publication rules"],
  },
  inactive_listing: {
    title: "Listing not actively published",
    description: "Listing status indicates it is not live for bookings.",
    suggestedActions: ["publish or archive intentionally", "resolve rejection reasons"],
  },
};

function safeListingId(signals: SyriaSignal[]): string {
  const first = signals[0];
  const raw = first?.contributingMetrics?.listingId;
  const id = typeof raw === "string" && raw.trim() ? raw.trim() : "unknown";
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function buildSyriaOpportunities(signals: SyriaSignal[]): SyriaOpportunity[] {
  if (!signals.length) return [];

  const sorted = [...signals].sort((a, b) => {
    const ds = BY_SEVERITY[b.severity] - BY_SEVERITY[a.severity];
    if (ds !== 0) return ds;
    return TYPE_RANK[a.type] - TYPE_RANK[b.type];
  });

  const lid = safeListingId(sorted);
  const top = sorted.slice(0, 5);

  return top.map((sig) => {
    const c = COPY[sig.type];
    const priority: SyriaOpportunity["priority"] =
      sig.severity === "critical" ? "high" : sig.severity === "warning" ? "medium" : "low";
    return {
      id: `syria-opp-${lid}-${sig.type}`,
      signalType: sig.type,
      title: c.title,
      description: c.description,
      suggestedActions: [...c.suggestedActions],
      priority,
    };
  });
}
