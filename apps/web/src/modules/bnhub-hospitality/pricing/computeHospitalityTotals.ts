import type { AddonLineBreakdown } from "@/lib/bnhub/hospitality-addons";
import { applyMembershipDiscounts } from "../services/membershipService";

export type HospitalityPricingSummary = {
  addonsSubtotalCents: number;
  bundleTotalCents: number;
  membershipDiscountCents: number;
  chargeableNowCents: number;
  pendingQuoteCentsHint: number;
  lines: AddonLineBreakdown[];
};

export function computeHospitalityAddOnTotals(lines: AddonLineBreakdown[]): {
  chargeableNowCents: number;
  pendingQuoteCount: number;
} {
  let chargeableNowCents = 0;
  let pendingQuoteCount = 0;
  for (const l of lines) {
    if (l.quoteRequired) pendingQuoteCount += 1;
    else chargeableNowCents += l.totalPriceCents;
  }
  return { chargeableNowCents, pendingQuoteCount };
}

export async function computeMembershipDiscountsForUser(
  hospitalitySubtotalCents: number,
  userId: string | null
): Promise<{ discountedCents: number; savedCents: number }> {
  const discounted = await applyMembershipDiscounts(hospitalitySubtotalCents, userId);
  return { discountedCents: discounted, savedCents: hospitalitySubtotalCents - discounted };
}

export async function computeFinalReservationHospitalitySummary(args: {
  addonLines: AddonLineBreakdown[];
  bundleTotalCents?: number;
  userId: string | null;
}): Promise<HospitalityPricingSummary> {
  const { chargeableNowCents, pendingQuoteCount } = computeHospitalityAddOnTotals(args.addonLines);
  const bundleTotal = args.bundleTotalCents ?? 0;
  const preDiscount = chargeableNowCents + bundleTotal;
  const discounted = await applyMembershipDiscounts(preDiscount, args.userId);
  const membershipDiscountCents = preDiscount - discounted;
  return {
    addonsSubtotalCents: chargeableNowCents,
    bundleTotalCents: bundleTotal,
    membershipDiscountCents,
    chargeableNowCents: discounted,
    pendingQuoteCentsHint: pendingQuoteCount,
    lines: args.addonLines,
  };
}
