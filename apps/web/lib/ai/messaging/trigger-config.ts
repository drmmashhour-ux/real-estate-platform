/** Keys aligned with guest messaging trigger toggles in host autopilot UI. */

export const GUEST_MESSAGE_TRIGGER_KEYS = [
  "booking_confirmed",
  "pre_checkin",
  "checkin",
  "checkout",
  "post_checkout",
] as const;

export type GuestMessageTriggerKey = (typeof GUEST_MESSAGE_TRIGGER_KEYS)[number];

/** Per-trigger UI state for host autopilot/BNHub guest lifecycle messaging */
export type GuestMessageTriggersState = Record<GuestMessageTriggerKey, { enabled: boolean }>;
