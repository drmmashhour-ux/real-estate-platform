/**
 * Naming prefixes for `recordPlatformEvent({ eventType })` and structured logs — single vocabulary, no duplicate semantics.
 * Callers concatenate: `${PREFIX}.${action}` e.g. `ai.autopilot.scan_completed`.
 */

export const PLATFORM_EVENT_PREFIX = {
  AI: "ai",
  AUTOPILOT: "autopilot",
  PAYMENT: "payment",
  PAYOUT: "payout",
  BOOKING: "booking",
  BNHUB: "bnhub",
  CRON: "cron",
  SECURITY: "security",
  MARKET: "market",
  INVESTOR: "investor",
} as const;

export type PlatformEventPrefix = (typeof PLATFORM_EVENT_PREFIX)[keyof typeof PLATFORM_EVENT_PREFIX];

export function platformEventType(prefix: PlatformEventPrefix, action: string): string {
  const a = action.trim().replace(/^\.+/, "");
  return `${prefix}.${a}`;
}
