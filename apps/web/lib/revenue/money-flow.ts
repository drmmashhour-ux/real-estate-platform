/**
 * Platform revenue & payout model (source of truth: Stripe + Prisma).
 *
 * BNHUB (short stays)
 * -------------------
 * Guest pays total via Stripe Checkout (Connect destination charge).
 * - platformFeeCents ≈ round(total × BNHUB_COMMISSION_RATE), default 15%
 * - hostPayoutCents = total − platformFeeCents (~85% to host via Connect transfer)
 * Stored on `Payment` after webhook; also mirrored on `PlatformPayment` for admin rollups.
 *
 * FSBO (sell-by-owner)
 * --------------------
 * Owner pays a one-time flat fee ($99 basic default, $199 premium default).
 * - platformFeeCents = full amount (100% platform)
 * - hostPayoutCents = 0 (no seller “payout” — this is a listing fee)
 *
 * Broker / traditional deals
 * ------------------------
 * Client fees and broker splits are handled outside this module today (manual / future Stripe).
 * `BrokerCommission` + admin broker payouts track broker share when applicable.
 */

export const BNHUB_PLATFORM_COMMISSION_LABEL = "15% of booking total (configurable via BNHUB_COMMISSION_RATE)";
export const FSBO_BASIC_FEE_LABEL = "$99 listing publish (configurable via FSBO_PUBLISH_PRICE_CENTS)";
export const FSBO_PREMIUM_FEE_LABEL = "$199 featured listing (configurable via FSBO_PREMIUM_PUBLISH_PRICE_CENTS)";
