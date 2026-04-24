/**
 * Guest retention domain — transparent, preference-aware; no fabricated urgency.
 */

export type RetentionSegment = "new_user" | "active_user" | "returning_user" | "inactive_user";

export type RetentionTouchType =
  | "still_looking"
  | "saved_listing_available"
  | "similar_stays"
  | "previous_destination"
  | "price_suggestion";

export type GuestBehaviorProfile = {
  userId: string;
  accountCreatedAt: Date;
  searchEvents30d: number;
  clientSearchEvents30d: number;
  behaviorEngagement30d: number;
  distinctListingViews30d: number;
  savesTotal: number;
  completedBookings: number;
  lastBookingCheckOut: Date | null;
  lastActivityAt: Date | null;
  /** Cities from confirmed/completed stays (deduped, recent first). */
  bookingCities: string[];
};

export type ReturnScoreResult = {
  score: number;
  /** 0–100, higher = more likely to book again (heuristic). */
  factors: { label: string; value: number; note: string }[];
};

export type RetentionReminderTemplate = {
  id: RetentionTouchType;
  title: string;
  body: string;
  /** Shown to ops / user re: why this message exists. */
  logicExplanation: string;
};
