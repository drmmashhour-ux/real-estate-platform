/**
 * Enterprise retention automation — triggers should be explicit (cron + feature flags).
 * Re-engagement copy is safe to surface in admin tools; email/push requires consent logs.
 */

import {
  reengagementMessage,
  type RetentionKind,
  placeholderRecommendations,
} from "@/services/growth/retention";
import { LOYALTY_TIERS, tierFromCompletedBookings, REPEAT_BOOKING_DISCOUNT_COPY } from "@/lib/growth/loyalty-program";

export function getReengagementCopy(kind: RetentionKind, name?: string, place?: string) {
  return reengagementMessage(kind, name, place);
}

export function getLoyaltySummary(completedBookings12mo: number) {
  const tier = tierFromCompletedBookings(completedBookings12mo);
  return {
    tierId: tier.id,
    label: tier.label,
    perks: tier.perks,
    nextTier: LOYALTY_TIERS.find((t) => t.minCompletedBookings12mo > completedBookings12mo) ?? null,
  };
}

export function getRecommendationStubs(userId: string, city?: string) {
  return placeholderRecommendations(userId, city);
}

export { REPEAT_BOOKING_DISCOUNT_COPY };

/** Suggested trigger rules (implement in worker with idempotency keys). */
export const RETENTION_TRIGGER_RULES = [
  { id: "guest_dormant_7d", description: "No session 7d after signup — dormant_guest_7d copy" },
  { id: "guest_dormant_30d", description: "No booking 30d after browse — dormant_guest_30d" },
  { id: "host_incomplete_listing", description: "Draft >5d — incomplete_listing" },
  { id: "post_stay_review", description: "Checkout +48h — post_stay_review" },
] as const;
