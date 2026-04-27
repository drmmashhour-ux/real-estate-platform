/**
 * SYBNB (short-stay) — feature flags and payment provider (Stripe-ready, off for Syria by default).
 */

export type SybnbPaymentProvider = "stripe" | "manual" | "sham_cash_placeholder";

export const sybnbConfig = {
  /** When false, no live card checkout; manual / offline flows only. */
  paymentsEnabled: process.env.SYBNB_PAYMENTS_ENABLED === "true",
  provider: (() => {
    const raw = (process.env.SYBNB_PAYMENT_PROVIDER ?? "manual").toLowerCase();
    if (raw === "stripe" || raw === "manual" || raw === "sham_cash_placeholder") {
      return raw as SybnbPaymentProvider;
    }
    return "manual" as const;
  })(),
  /** Staging: auto-approve new stay listings (production should leave false and use admin). */
  autoApproveStays: process.env.SYBNB_AUTO_APPROVE_STAYS === "true",
  /**
   * Mock compliance for payment intent — when `strict`, only passes if env simulates pass.
   * Real integrations replace this with sanctions screening API.
   */
  complianceMode: (process.env.SYBNB_COMPLIANCE_MODE ?? "relaxed") as "relaxed" | "strict",
  complianceMock: (process.env.SYBNB_COMPLIANCE_MOCK ?? "pass") as "pass" | "fail",
  /**
   * Hosts with accounts newer than this many days cannot use **instant book** (when offered).
   * Unverified hosts are blocked separately via `hostMayEnableSybnbInstantBook`.
   */
  minHostAccountAgeForInstantBookDays: (() => {
    const n = Number(process.env.SYBNB_MIN_HOST_ACCOUNT_AGE_DAYS_FOR_INSTANT ?? "7");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 7;
  })(),
} as const;
