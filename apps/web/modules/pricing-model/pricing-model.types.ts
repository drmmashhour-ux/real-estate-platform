import type { LecipmPlanKey } from "@/modules/business/pricing-model.types";

export type BnhubFeeEducationBreakdown = {
  lodgingSubtotalAfterDiscountCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  guestServiceFeeCents: number;
  hostPlatformFeeCents: number;
  guestTotalBeforeAddonsCents: number;
  hostNetLodgingPayoutCents: number;
  guestServiceFeePercent: number;
  hostPlatformFeePercent: number;
  currency: string;
  comparisonNotes: string[];
};

export type PricingQuoteLine = {
  label: string;
  amountCents: number;
  kind: "fee" | "tax" | "payout" | "total";
};

export type CompetitorComparisonInput = {
  /** Gross booking value (minor units). */
  grossBookingCents: number;
  /** Competitor take as decimal (e.g. 0.15 = 15%). User-provided — not verified. */
  competitorFeePercent: number;
  /** LECIPM host plan for platform fee on gross. */
  lecipmPlanKey: LecipmPlanKey;
};
