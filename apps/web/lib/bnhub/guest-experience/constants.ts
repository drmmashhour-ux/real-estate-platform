/** Outcome types stored on `AiOutcomeSignal` for BNHUB guest experience (retention / reviews). */
export const BNHUB_GUEST_EXPERIENCE_RULE = "bnhub_guest_experience" as const;

export type GuestExperienceOutcomeType =
  | "review_request_sent"
  | "review_request_reminder_sent"
  | "repeat_booking_nudge_sent"
  | "review_submitted"
  | "review_ignored"
  | "repeat_visit"
  | "message_opened";

export const GATE_RULE_REVIEW_REQUEST = "bnhub_guest_experience_review_request";
export const GATE_RULE_REVIEW_REMINDER = "bnhub_guest_experience_review_reminder";
export const GATE_RULE_REPEAT_NUDGE = "bnhub_guest_experience_repeat_nudge";
