/**
 * BNHub booking revenue — guest-facing totals, platform fee, host payout.
 *
 * Production persistence uses `Booking` + `Payment` (cents): map
 * `baseAmount` → lodging subtotal (+ agreed extras), `serviceFee` → `guestFeeCents` /
 * quote fees, `total` → `priceSnapshotTotalCents` / `Payment.amountCents`.
 * Stripe Checkout already receives `bookingId` + `listingId` in session metadata (`lib/stripe/checkout.ts`).
 */

import type { BnhubUpsellSelection } from "@/lib/monetization/bnhub-checkout-pricing";
import { bnhubUpsellLineCents } from "@/lib/monetization/bnhub-checkout-pricing";

/** Inclusive band for the guest-facing platform service fee (percent). */
export const BNHUB_PLATFORM_FEE_PERCENT_MIN = 10;
export const BNHUB_PLATFORM_FEE_PERCENT_MAX = 15;

/**
 * Resolved guest service fee percent, clamped to [10, 15].
 * Override with `BNHUB_PLATFORM_FEE_PERCENT` (e.g. `12`).
 */
export function resolveBnhubPlatformGuestFeePercent(): number {
  const raw = Number(process.env.BNHUB_PLATFORM_FEE_PERCENT ?? "12");
  if (!Number.isFinite(raw)) return 12;
  return Math.min(BNHUB_PLATFORM_FEE_PERCENT_MAX, Math.max(BNHUB_PLATFORM_FEE_PERCENT_MIN, Math.round(raw)));
}

export type BookingRevenueBreakdownCents = {
  /** Host/base portion before platform fee (nights × nightly + extras + upsells). */
  baseAmountCents: number;
  /** Platform service fee on `feeBaseCents` (same as base for this calculator). */
  serviceFeeCents: number;
  /** Amount the guest pays (base + service fee). */
  totalCents: number;
  /** What the host keeps: total − service fee (= base). */
  hostReceivesCents: number;
  serviceFeePercent: number;
  upsellsCents: number;
  extrasCents: number;
};

export type CalculateBookingTotalOptions = {
  /** Override platform fee percent (still clamped 10–15). */
  serviceFeePercent?: number;
  /** Cleaning and other host extras in cents — included in guest base; fee applies to this base. */
  extrasCents?: number;
  upsells?: BnhubUpsellSelection;
};

function clampFeePercent(p: number): number {
  if (!Number.isFinite(p)) return resolveBnhubPlatformGuestFeePercent();
  return Math.min(BNHUB_PLATFORM_FEE_PERCENT_MAX, Math.max(BNHUB_PLATFORM_FEE_PERCENT_MIN, Math.round(p)));
}

/**
 * Core calculator (integer cents). Platform fee applies to the full guest base
 * (nightly subtotal + extras + optional upsells).
 */
export function calculateBookingTotalCents(
  nightPriceCents: number,
  nights: number,
  opts?: CalculateBookingTotalOptions,
): BookingRevenueBreakdownCents {
  const n = Math.max(1, Math.floor(nights));
  const nightly = Math.max(0, Math.round(nightPriceCents));
  const extrasCents = Math.max(0, Math.round(opts?.extrasCents ?? 0));
  const upsells = bnhubUpsellLineCents(opts?.upsells);
  const upsellsCents = upsells.insurance + upsells.earlyCheckIn + upsells.lateCheckOut + upsells.cleaningAddon;
  const baseAmountCents = nightly * n + extrasCents + upsellsCents;
  const pct = clampFeePercent(opts?.serviceFeePercent ?? resolveBnhubPlatformGuestFeePercent());
  const serviceFeeCents = Math.round((baseAmountCents * pct) / 100);
  const totalCents = baseAmountCents + serviceFeeCents;
  return {
    baseAmountCents,
    serviceFeeCents,
    totalCents,
    hostReceivesCents: baseAmountCents,
    serviceFeePercent: pct,
    upsellsCents,
    extrasCents,
  };
}

/**
 * @param pricePerNight — nightly rate in major currency units (e.g. CAD dollars), host portion only.
 * @param opts.extras — host extras (e.g. cleaning) in major units; alternatively use `extrasCents` on opts.
 * @returns Amounts in major units (Float) for quick quotes / dashboards.
 */
export function calculateBookingTotal(
  pricePerNight: number,
  nights: number,
  opts?: CalculateBookingTotalOptions & { extras?: number },
): {
  baseAmount: number;
  serviceFee: number;
  total: number;
  hostReceives: number;
  serviceFeePercent: number;
} {
  const extrasCents =
    opts?.extras != null
      ? Math.round(opts.extras * 100)
      : Math.max(0, Math.round(opts?.extrasCents ?? 0));
  const nightCents = Math.round(Math.max(0, pricePerNight) * 100);
  const b = calculateBookingTotalCents(nightCents, nights, { ...opts, extrasCents });
  return {
    baseAmount: b.baseAmountCents / 100,
    serviceFee: b.serviceFeeCents / 100,
    total: b.totalCents / 100,
    hostReceives: b.hostReceivesCents / 100,
    serviceFeePercent: b.serviceFeePercent,
  };
}
