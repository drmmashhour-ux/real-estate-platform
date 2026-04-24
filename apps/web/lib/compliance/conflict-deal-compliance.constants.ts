/** Legal deal status — blocks progression until client acknowledgments are recorded. */
export const CONFLICT_REQUIRES_DISCLOSURE_STATUS = "CONFLICT_REQUIRES_DISCLOSURE" as const;

/** Shown to buyers/sellers when a broker conflict is present (exact copy for OACIQ-oriented transparency). */
export const CONFLICT_DISCLOSURE_WARNING_MESSAGE =
  "This broker has a personal or financial interest in this transaction.";

/**
 * Checkbox / acknowledgment wording enforced server-side (must match POST body exactly).
 * Spec: "I acknowledge the broker's interest"
 */
export const CONFLICT_DISCLOSURE_ACK_TEXT = "I acknowledge the broker's interest";

export const CONFLICT_DISCLOSURE_META_PREVIOUS_STATUS_KEY = "conflictDisclosurePreviousStatus" as const;

export type ConflictReasonCode =
  | "BROKER_IS_TRANSACTION_PARTY"
  | "BROKER_OWNS_PLATFORM_LISTING"
  | "BROKER_CAPITAL_INTEREST";
