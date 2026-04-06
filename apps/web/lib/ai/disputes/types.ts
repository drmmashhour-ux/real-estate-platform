import type {
  AiDisputePreventionAction,
  AiDisputeRiskLevel,
  AiDisputeRiskSignalType,
} from "@prisma/client";

/** Pure inputs for detection (no DB side effects). */
export type BookingRiskContext = {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  status: string;
  guestId: string;
  hostId: string;
  checkIn: Date;
  checkOut: Date;
  now: Date;
  checkedInAt: Date | null;
  checklistDeclaredByHostAt: Date | null;
  /** True when structured check-in details exist with usable access info. */
  hasAdequateCheckinDetails: boolean;
  /** Last message from host in this booking thread (if any). */
  hostLastMessageAt: Date | null;
  /** Last message from guest in this booking thread (if any). */
  guestLastMessageAt: Date | null;
  /** Most recent message (any sender). */
  lastMessageAt: Date | null;
  lastMessageSenderId: string | null;
  /** Non-resolved issues on this booking. */
  unresolvedIssueCount: number;
  /** Issues on this booking (any status except resolved). */
  activeIssueCount: number;
  /** Open issues on this listing in the lookback window. */
  listingOpenIssueCount90d: number;
  /** Guest review for this booking, if present. */
  review: {
    propertyRating: number;
    accuracyRating: number | null;
    amenitiesAsAdvertised: boolean | null;
  } | null;
  /** Listing quality / verification snapshot. */
  listingVerificationStatus: string;
  listingHasPhotos: boolean;
};

export type DetectedRisk = {
  riskLevel: AiDisputeRiskLevel;
  signalType: AiDisputeRiskSignalType;
  summary: string;
  recommendedAction: string;
  preventionAction: AiDisputePreventionAction;
  messageDraftHost: string | null;
  messageDraftGuest: string | null;
  cooldownKey: string;
  /** For GENTLE_REMINDER: who should receive the nudge (UI / optional notify). */
  reminderTarget?: "host" | "guest";
  metadata?: Record<string, unknown>;
};
