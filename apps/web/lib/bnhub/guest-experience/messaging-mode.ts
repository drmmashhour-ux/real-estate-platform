import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";

/**
 * How outbound guest-facing copy may be delivered for BNHUB retention flows.
 * - `off`: no automated host-thread messages (platform nudges may still use neutral system notifications).
 * - `draft_only`: host sees a Manager AI recommendation; optional safe platform reminder to guest.
 * - `auto_send_safe`: host identity may post templated safe messages in booking chat when gate passes.
 */
export type BnhubGuestMessagingDelivery = "off" | "draft_only" | "auto_send_safe";

export function bnhubGuestMessagingDelivery(cfg: HostAutopilotConfig): BnhubGuestMessagingDelivery {
  if (cfg.guestMessaging.autoGuestMessagingEnabled) {
    return cfg.guestMessaging.guestMessageMode === "auto_send_safe" ? "auto_send_safe" : "draft_only";
  }
  if (!cfg.autopilotEnabled || !cfg.preferences.autoMessaging) {
    return "off";
  }
  if (cfg.autopilotMode === "SAFE_AUTOPILOT") {
    return "auto_send_safe";
  }
  if (cfg.autopilotMode === "ASSIST" || cfg.autopilotMode === "FULL_AUTOPILOT_APPROVAL") {
    return "draft_only";
  }
  return "off";
}
