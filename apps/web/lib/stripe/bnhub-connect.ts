/**
 * BNHUB short-term rental commission — single platform fee model.
 *
 * - Guest pays `totalAmountCents`.
 * - `platformFeeCents = round(totalAmountCents * commissionRate)` (default rate 15%).
 * - `hostPayoutCents = totalAmountCents - platformFeeCents`.
 *
 * Configure rate with env (primary): BNHUB_COMMISSION_RATE=0.15
 * Legacy alias: BNHUB_PLATFORM_COMMISSION_RATE (still read if primary unset).
 *
 * Revenue reporting: `platformFeeCents` is persisted on bookings / Stripe webhook reconciliation — auditable in admin finance flows.
 * For market tests in the 5%–10% range, lower the env rate in a controlled rollout (do not hardcode in UI).
 */

/** Canonical default when env is missing or invalid — 15% platform fee. */
export const BNHUB_COMMISSION_RATE_DEFAULT = 0.15;

/** @deprecated Use BNHUB_COMMISSION_RATE_DEFAULT */
export const BNHUB_CONNECT_COMMISSION_RATE = BNHUB_COMMISSION_RATE_DEFAULT;

export type BnhubBookingFeeSplit = {
  totalAmountCents: number;
  platformFeeCents: number;
  hostPayoutCents: number;
};

/**
 * Platform take rate in (0, 1). Defaults to {@link BNHUB_COMMISSION_RATE_DEFAULT}.
 */
export function getBnhubCommissionRate(): number {
  const raw =
    process.env.BNHUB_COMMISSION_RATE?.trim() || process.env.BNHUB_PLATFORM_COMMISSION_RATE?.trim();
  if (!raw) return BNHUB_COMMISSION_RATE_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return BNHUB_COMMISSION_RATE_DEFAULT;
  return n;
}

/**
 * Explicit auditable split: platform + host = total, both ≥ 0.
 */
export function bnhubBookingFeeSplitCents(totalAmountCents: number): BnhubBookingFeeSplit {
  if (!Number.isFinite(totalAmountCents) || totalAmountCents < 1) {
    const t = Math.max(0, Math.round(Number(totalAmountCents) || 0));
    return { totalAmountCents: t, platformFeeCents: 0, hostPayoutCents: 0 };
  }
  const total = Math.round(totalAmountCents);
  const rate = getBnhubCommissionRate();
  const platformFeeCents = Math.round(total * rate);
  const clampedPlatform = Math.min(Math.max(0, platformFeeCents), total);
  const hostPayoutCents = total - clampedPlatform;
  return { totalAmountCents: total, platformFeeCents: clampedPlatform, hostPayoutCents };
}

/** True when split matches total and parts are non-negative. */
export function bnhubFeeSplitIsValid(split: BnhubBookingFeeSplit): boolean {
  if (split.platformFeeCents < 0 || split.hostPayoutCents < 0) return false;
  if (split.totalAmountCents < 0) return false;
  return split.platformFeeCents + split.hostPayoutCents === split.totalAmountCents;
}

/**
 * Application fee for Stripe Connect `payment_intent_data.application_fee_amount`.
 * With default 15% rate this equals `bnhubBookingFeeSplitCents(total).platformFeeCents`.
 * If an extreme configured rate made fee ≥ total (should not happen with getBnhubCommissionRate bounds),
 * caps so the connected account receives at least 1 minor unit — Stripe requires fee &lt; charge.
 */
export function bnhubStripeApplicationFeeCents(totalAmountCents: number): number {
  const split = bnhubBookingFeeSplitCents(totalAmountCents);
  if (split.totalAmountCents < 1) return 0;
  if (split.platformFeeCents >= split.totalAmountCents) {
    return Math.max(0, split.totalAmountCents - 1);
  }
  return split.platformFeeCents;
}

/** @deprecated Prefer bnhubBookingFeeSplitCents().platformFeeCents or bnhubStripeApplicationFeeCents for Stripe. */
export function bnhubApplicationFeeCents(totalChargedToGuestCents: number): number {
  return bnhubStripeApplicationFeeCents(totalChargedToGuestCents);
}

export function bnhubHostTransferCents(totalChargedToGuestCents: number, applicationFeeCents: number): number {
  const total = Math.round(totalChargedToGuestCents);
  return Math.max(0, total - applicationFeeCents);
}
