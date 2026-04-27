import type { SyriaBookingStatus } from "@/generated/prisma";

const allowed: Record<SyriaBookingStatus, SyriaBookingStatus[]> = {
  PENDING: ["CANCELLED", "APPROVED"],
  APPROVED: ["CONFIRMED"],
  CONFIRMED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * SYBNB stay booking state machine — all transitions must go through this (host action, webhook, completion).
 */
export function isAllowedSybnbStayStatusTransition(
  from: SyriaBookingStatus,
  to: SyriaBookingStatus,
): boolean {
  return (allowed[from] ?? []).includes(to);
}
