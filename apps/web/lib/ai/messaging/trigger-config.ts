export const GUEST_MESSAGE_TRIGGER_KEYS = [
  "booking_confirmed",
  "pre_checkin",
  "checkin",
  "checkout",
  "post_checkout",
] as const;

export type GuestMessageTriggerKey = (typeof GUEST_MESSAGE_TRIGGER_KEYS)[number];

export type GuestMessageTriggersState = Record<GuestMessageTriggerKey, { enabled: boolean }>;

export const DEFAULT_GUEST_MESSAGE_TRIGGERS: GuestMessageTriggersState = {
  booking_confirmed: { enabled: false },
  pre_checkin: { enabled: false },
  checkin: { enabled: false },
  checkout: { enabled: false },
  post_checkout: { enabled: false },
};

export function mergeGuestMessageTriggers(json: unknown): GuestMessageTriggersState {
  const out = { ...DEFAULT_GUEST_MESSAGE_TRIGGERS };
  if (!json || typeof json !== "object" || Array.isArray(json)) return out;
  const o = json as Record<string, unknown>;
  for (const k of GUEST_MESSAGE_TRIGGER_KEYS) {
    const v = o[k];
    if (v && typeof v === "object" && v !== null && "enabled" in v) {
      const en = (v as { enabled: unknown }).enabled;
      if (typeof en === "boolean") {
        out[k] = { enabled: en };
      }
    }
  }
  return out;
}
