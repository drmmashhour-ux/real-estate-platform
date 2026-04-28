/**
 * Syria app flags — env-backed, safe defaults (no auto payout).
 */

/** Darlink product lane — independent of other monorepo apps; default on unless explicitly disabled. */
export const DARLINK_PLATFORM_ENABLED = process.env.DARLINK_PLATFORM_ENABLED !== "false";

export function isDarlinkEnabled(): boolean {
  return DARLINK_PLATFORM_ENABLED;
}

export const syriaFlags = {
  SYRIA_PLATFORM_ENABLED: process.env.SYRIA_PLATFORM_ENABLED !== "false",
  /** When true (default), phone-first MVP: short sell form, no map required, go-live without payment rows. */
  SYRIA_MVP: process.env.SYRIA_MVP !== "false",
  BNHUB_ENABLED: process.env.BNHUB_ENABLED !== "false",
  /** When false (default), hosts are never auto-paid; admin approves payouts. */
  AUTO_PAYOUT_ENABLED: process.env.AUTO_PAYOUT_ENABLED === "true",
  /**
   * Local-first UI: IndexedDB cache, offline queue, service worker stale-while-revalidate.
   * Default enabled; set NEXT_PUBLIC_SYRIA_OFFLINE_FIRST=0 to disable client-side wiring only.
   */
  SYRIA_OFFLINE_FIRST: typeof process.env.NEXT_PUBLIC_SYRIA_OFFLINE_FIRST === "undefined" || process.env.NEXT_PUBLIC_SYRIA_OFFLINE_FIRST !== "false",
} as const;

export function assertSyriaEnabled(): boolean {
  return syriaFlags.SYRIA_PLATFORM_ENABLED;
}

/** BNHub + stays UI hidden during phone-first MVP. */
export function isBnhubInSyriaUI(): boolean {
  return syriaFlags.BNHUB_ENABLED && !syriaFlags.SYRIA_MVP;
}

/**
 * Darlink full autonomy OS — conservative defaults:
 * autonomy off, approvals on, auto-execute off, optimization off.
 */
export const darlinkAutonomyFlags = {
  /** Master switch — default false. */
  AUTONOMY_ENABLED: process.env.DARLINK_AUTONOMY_ENABLED === "true",
  /** Approval queue for gated actions — default true. */
  APPROVALS_ENABLED: process.env.DARLINK_AUTONOMY_APPROVALS_ENABLED !== "false",
  /** Low-risk internal auto-execute — default false. */
  AUTO_EXECUTE_ENABLED: process.env.DARLINK_AUTONOMY_AUTO_EXECUTE_ENABLED === "true",
  /** Adjustment / optimization recommendations — default false. */
  OPTIMIZATION_ENABLED: process.env.DARLINK_AUTONOMY_OPTIMIZATION_ENABLED === "true",
} as const;

export function getDarlinkAutonomyFlags(): typeof darlinkAutonomyFlags {
  return darlinkAutonomyFlags;
}
