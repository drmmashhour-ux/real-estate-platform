/**
 * Syria app flags — env-backed, safe defaults (no auto payout).
 */

/** Darlink product lane — independent of LECIPM flags; default on unless explicitly disabled. */
export const DARLINK_PLATFORM_ENABLED = process.env.DARLINK_PLATFORM_ENABLED !== "false";

export function isDarlinkEnabled(): boolean {
  return DARLINK_PLATFORM_ENABLED;
}

export const syriaFlags = {
  SYRIA_PLATFORM_ENABLED: process.env.SYRIA_PLATFORM_ENABLED !== "false",
  BNHUB_ENABLED: process.env.BNHUB_ENABLED !== "false",
  /** When false (default), hosts are never auto-paid; admin approves payouts. */
  AUTO_PAYOUT_ENABLED: process.env.AUTO_PAYOUT_ENABLED === "true",
} as const;

export function assertSyriaEnabled(): boolean {
  return syriaFlags.SYRIA_PLATFORM_ENABLED;
}
