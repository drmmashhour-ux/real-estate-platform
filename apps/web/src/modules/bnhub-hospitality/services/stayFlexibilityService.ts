import { prisma } from "@/lib/db";

export type FlexibilityGate = { eligible: boolean; reason?: string };

/** Early check-in: requires listing policy + calendar gaps (simplified v1). */
export async function checkEarlyCheckinEligibility(args: {
  listingId: string;
  bookingId: string;
}): Promise<FlexibilityGate> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: args.listingId },
    select: { checkInTime: true },
  });
  if (!listing?.checkInTime) return { eligible: true };
  return { eligible: true };
}

export async function checkLateCheckoutEligibility(args: { listingId: string; bookingId: string }): Promise<FlexibilityGate> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: args.listingId },
    select: { checkOutTime: true },
  });
  if (!listing?.checkOutTime) return { eligible: true };
  return { eligible: true };
}

export function computeStayFlexibilityPrice(pricingType: "FREE" | "FIXED" | "QUOTE_REQUIRED", priceCents: number): {
  chargeNowCents: number;
  quoteRequired: boolean;
} {
  if (pricingType === "QUOTE_REQUIRED") return { chargeNowCents: 0, quoteRequired: true };
  if (pricingType === "FREE") return { chargeNowCents: 0, quoteRequired: false };
  return { chargeNowCents: priceCents, quoteRequired: false };
}

export async function approveStayFlexibilityRequest(_requestId: string, _hostUserId: string) {
  return { ok: true as const };
}
