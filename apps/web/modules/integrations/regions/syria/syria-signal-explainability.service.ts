/**
 * Short, deterministic explanation lines for Syria signals — no legal claims, no throws.
 */
import type { SyriaSignal, SyriaSignalType } from "./syria-signal.types";

const LINE: Record<SyriaSignalType, string> = {
  low_conversion_high_views: "This listing has high views but low bookings.",
  low_booking_activity: "This listing shows limited booking activity.",
  potential_fraud_pattern: "This listing shows indicators of potential risk.",
  listing_stale: "This listing has not received recent updates.",
  payout_anomaly: "Payout metrics for this listing look uneven.",
  review_backlog: "This listing is waiting in the review queue.",
  inactive_listing: "This listing is not in an active published state.",
};

const TYPE_ORDER: SyriaSignalType[] = [
  "potential_fraud_pattern",
  "payout_anomaly",
  "review_backlog",
  "low_conversion_high_views",
  "low_booking_activity",
  "listing_stale",
  "inactive_listing",
];

export function explainSyriaSignals(signals: SyriaSignal[]): string[] {
  if (!signals.length) return [];
  const seen = new Set<SyriaSignalType>();
  const lines: string[] = [];
  const byType = new Map<SyriaSignalType, SyriaSignal>();
  for (const s of signals) {
    byType.set(s.type, s);
  }
  for (const t of TYPE_ORDER) {
    if (!byType.has(t) || seen.has(t)) continue;
    seen.add(t);
    lines.push(LINE[t]);
  }
  return lines;
}
