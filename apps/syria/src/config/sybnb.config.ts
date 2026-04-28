/**
 * SYBNB (short-stay) — feature flags and payment provider (Stripe-ready, off for Syria by default).
 */

export type SybnbPaymentProvider = "stripe" | "manual" | "sham_cash_placeholder";

/**
 * “Production lock” for SYBNB money movement — default **ON** (safe).
 * Set `SYBNB_PRODUCTION_LOCK_MODE=false` only in controlled non-prod (e.g. staging + Stripe test keys).
 */
export const PRODUCTION_LOCK_MODE = process.env.SYBNB_PRODUCTION_LOCK_MODE !== "false";

/**
 * **Kill switches** — when `true`, block in-app card payment and payout state transitions immediately.
 * Does not remove routes; `payment-policy` and admin actions enforce the block.
 */
export const SYBNB_PAYMENTS_KILL_SWITCH = process.env.SYBNB_PAYMENTS_KILL_SWITCH === "true";
export const SYBNB_PAYOUTS_KILL_SWITCH = process.env.SYBNB_PAYOUTS_KILL_SWITCH === "true";

const rawSybnbPaymentsEnabled = process.env.SYBNB_PAYMENTS_ENABLED === "true";
if (rawSybnbPaymentsEnabled && PRODUCTION_LOCK_MODE) {
  console.error(
    "🚨 Attempt to enable SYBNB payments while PRODUCTION_LOCK_MODE is active — payments stay disabled until lock is cleared",
  );
}

export const sybnbConfig = {
  /** When false, no live card checkout; manual / offline flows only. Forced off while {@link PRODUCTION_LOCK_MODE}. */
  paymentsEnabled: rawSybnbPaymentsEnabled && !PRODUCTION_LOCK_MODE,
  /**
   * When false (default), **instant book** is never available — all stays go through request / host action.
   * Set `SYBNB_INSTANT_BOOK_ENABLED=true` only when product + compliance allow it.
   */
  instantBookEnabled: process.env.SYBNB_INSTANT_BOOK_ENABLED === "true",
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
  /**
   * Block new stay requests when a listing has this many unreviewed `ListingReport` rows.
   * Aligns with host supply pause at higher abuse tiers (operator process).
   */
  maxUnreviewedReportsBlockBookings: (() => {
    const n = Number(process.env.SYBNB_MAX_UNREVIEWED_REPORTS_BLOCK ?? "5");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
  })(),
  /**
   * When true, the host (listing owner) must be phone- or account-verified before new SYBNB requests.
   * Default off so local/staging can onboard without SMS.
   */
  requireHostVerifiedForStayRequests: process.env.SYBNB_REQUIRE_HOST_VERIFIED === "true",
  /**
   * In production, SYBNB checkout webhook must configure `SYBNB_STRIPE_WEBHOOK_SECRET` and send matching header
   * (or disable with SYBNB_WEBHOOK_ALLOW_UNAUTHENTICATED=1 in dev-only sandboxes).
   */
  requireWebhookSharedSecret: (() => {
    if (process.env.SYBNB_WEBHOOK_ALLOW_UNAUTHENTICATED === "1") return false;
    return process.env.NODE_ENV === "production";
  })(),
  /** Card risk — review queue if listing has ≥ this many S1+SYBNB reports (cumulative). */
  reviewPaymentListingReportThreshold: (() => {
    const n = Number(process.env.SYBNB_REVIEW_PAYMENT_LISTING_REPORTS_MIN ?? "3");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
  })(),
  /** Card risk — review queue if seller (all their listings) has ≥ this many reports. */
  reviewPaymentSellerReportThreshold: (() => {
    const n = Number(process.env.SYBNB_REVIEW_PAYMENT_SELLER_REPORTS_MIN ?? "5");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
  })(),
  /** "Recently" for price/contact heuristics when listing or profile has no per-field history (ms). */
  recentChangeRiskWindowMs: (() => {
    const h = Number(process.env.SYBNB_RECENT_CHANGE_RISK_HOURS ?? "48");
    const hrs = Number.isFinite(h) && h > 0 ? h : 48;
    return Math.floor(hrs * 3600000);
  })(),
  /**
   * Escrow / delayed payout (internal ledger only; no auto PSP transfer in-app).
   * Defaults: escrow on, 24h after checkout before eligible, no auto release, admin approval required.
   */
  escrowEnabled: process.env.SYBNB_ESCROW_ENABLED !== "false",
  payoutDelayHours: (() => {
    const n = Number(process.env.SYBNB_PAYOUT_DELAY_HOURS ?? "24");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 24;
  })(),
  autoReleasePayouts: process.env.SYBNB_AUTO_RELEASE_PAYOUTS === "true",
  manualPayoutApprovalRequired: process.env.SYBNB_MANUAL_PAYOUT_APPROVAL_REQUIRED !== "false",
  /**
   * Reserved for a future cron: drop stale `SyriaProperty.availability` calendar keys older than N days without an owner refresh.
   * `0` or unset = off (default).
   */
  availabilityStaleResetDays: (() => {
    const n = Number(process.env.SYBNB_AVAILABILITY_STALE_RESET_DAYS ?? "0");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  })(),
} as const;
