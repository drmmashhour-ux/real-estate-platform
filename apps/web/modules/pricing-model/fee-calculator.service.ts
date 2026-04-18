import { BNHUB_GUEST_SERVICE_FEE_PERCENT, BNHUB_HOST_FEE_PERCENT } from "@/lib/bnhub/booking-pricing";
import { calculatePlatformFee, getPlanByKey } from "@/modules/business/pricing-model.service";
import type { BnhubFeeEducationBreakdown } from "./pricing-model.types";

/**
 * Educational breakdown aligned with `lib/bnhub/booking-pricing.ts` lodging lines (pre-add-ons).
 * Does not replace live checkout — taxes here must match caller’s tax engine when used for quotes.
 */
export function calculateBnhubLodgingFeeEducation(input: {
  lodgingSubtotalAfterDiscountCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  currency?: string;
}): BnhubFeeEducationBreakdown {
  const base = Math.max(0, input.lodgingSubtotalAfterDiscountCents);
  const cleaning = Math.max(0, input.cleaningFeeCents);
  const tax = Math.max(0, input.taxCents);

  const guestServiceFeeCents = Math.round((base * BNHUB_GUEST_SERVICE_FEE_PERCENT) / 100);
  const hostPlatformFeeCents = Math.round((base * BNHUB_HOST_FEE_PERCENT) / 100);
  const guestTotalBeforeAddonsCents = base + cleaning + tax + guestServiceFeeCents;
  const hostNetLodgingPayoutCents = base + cleaning - hostPlatformFeeCents;

  return {
    lodgingSubtotalAfterDiscountCents: base,
    cleaningFeeCents: cleaning,
    taxCents: tax,
    guestServiceFeeCents,
    hostPlatformFeeCents,
    guestTotalBeforeAddonsCents,
    hostNetLodgingPayoutCents,
    guestServiceFeePercent: BNHUB_GUEST_SERVICE_FEE_PERCENT,
    hostPlatformFeePercent: BNHUB_HOST_FEE_PERCENT,
    currency: input.currency ?? "CAD",
    comparisonNotes: [
      "Guest service fee and host fee apply to the lodging subtotal after discounts (BNHub checkout rules).",
      "Taxes are illustrative unless recomputed with the Québec lodging tax helper for real dates.",
    ],
  };
}

/**
 * Host plan booking fee on gross STR revenue (LECIPM plan — separate from BNHub per-night host % above).
 * Uses `modules/business` plan table + env overrides.
 */
export function calculateHostPlanBookingFeeCents(planKey: string, grossRevenueCents: number): number {
  return calculatePlatformFee(planKey, grossRevenueCents);
}

export function describeHostPlanFee(planKey: string): { bookingFeePercent: number; label: string } | null {
  const p = getPlanByKey(planKey);
  if (!p) return null;
  return { bookingFeePercent: p.bookingFeePercent, label: p.displayName };
}
