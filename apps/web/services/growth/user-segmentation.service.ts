import type { UserSegment, UserSegmentSignals } from "./v4-types";

/**
 * Heuristic segment from behavioral signals (no PII). Order matches product priority.
 */
export function detectUserSegment(user: UserSegmentSignals | null | undefined): UserSegment {
  if (!user) return "NEW_VISITOR";

  if (user.bookingStarted && !user.bookingCompleted) {
    return "ABANDONED_BOOKING";
  }

  if ((user.totalBookings ?? 0) > 3) return "HIGH_VALUE";

  if (user.lastVisit != null && user.lastVisit < Date.now() - 7 * 24 * 60 * 60 * 1000) {
    return "RETURNING_USER";
  }

  if ((user.pagesViewed ?? 0) > 5) return "HIGH_INTENT";

  return "NEW_VISITOR";
}
