/**
 * Production payment rails (apps/web).
 * Defaults are conservative — set explicitly in `.env`:
 * @see PHASE 9 — PAYMENTS_ENABLED=true only when deliberately turning on monetization.
 */

export type PaymentRailsBlockReason = "production_lock_disabled" | "payments_disabled";

export function isProductionLockMode(): boolean {
  return process.env.PRODUCTION_LOCK_MODE?.trim() === "true";
}

export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED?.trim() === "true";
}

/** Checkout / Connect money-movement endpoints: both flags must allow traffic. */
export function getCheckoutRailsBlockReason(): PaymentRailsBlockReason | null {
  if (!isProductionLockMode()) return "production_lock_disabled";
  if (!isPaymentsEnabled()) return "payments_disabled";
  return null;
}

/** Webhooks / compliance latch (Phase 2): production lock alone. */
export function getIngressProductionLockReason(): PaymentRailsBlockReason | null {
  if (!isProductionLockMode()) return "production_lock_disabled";
  return null;
}
