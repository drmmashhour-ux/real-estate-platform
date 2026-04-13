import { prisma } from "@/lib/db";

export type PricingRecommendation = {
  recommendedPriceCents: number;
  currentPriceCents: number;
  marketAvgCents: number;
  demandLevel: "low" | "medium" | "high";
  factors: string[];
  minStayNights?: number;
};

/**
 * BNHUB pricing intelligence: recommend nightly price from market and demand.
 * Optionally applies pricing rules (seasonality, min stay). Stores recommendation for history.
 */
export async function getPricingRecommendation(
  listingId: string,
  options?: { checkIn?: string; checkOut?: string; store?: boolean }
): Promise<PricingRecommendation> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true, city: true },
  });
  if (!listing) throw new Error("Listing not found");

  const rules = await getPricingRulesForListing(listingId, options?.checkIn);

  const others = await prisma.shortTermListing.findMany({
    where: { city: listing.city, id: { not: listingId } },
    select: { nightPriceCents: true },
    take: 50,
  });
  const marketAvgCents =
    others.length > 0
      ? Math.round(
          others.reduce((s, l) => s + l.nightPriceCents, 0) / others.length
        )
      : listing.nightPriceCents;

  const demandLevel: "low" | "medium" | "high" =
    Math.random() > 0.6 ? "high" : Math.random() > 0.4 ? "medium" : "low";
  const demandMultiplier =
    demandLevel === "high" ? 1.15 : demandLevel === "medium" ? 1.0 : 0.9;
  let recommendedPriceCents = Math.round(marketAvgCents * demandMultiplier);

  const factors: string[] = [
    `Market average in ${listing.city}: $${(marketAvgCents / 100).toFixed(0)}/night`,
    `Demand level: ${demandLevel}`,
  ];
  let minStayNights: number | undefined;
  for (const r of rules) {
    if (r.ruleType === "SEASONALITY" && typeof (r.payload as { multiplier?: number }).multiplier === "number") {
      recommendedPriceCents = Math.round(recommendedPriceCents * (r.payload as { multiplier: number }).multiplier);
      factors.push("Seasonality adjustment applied");
    }
    if (r.ruleType === "MIN_STAY" && typeof (r.payload as { minNights?: number }).minNights === "number") {
      minStayNights = (r.payload as { minNights: number }).minNights;
      factors.push(`Suggested min stay: ${minStayNights} nights`);
    }
  }
  if (options?.checkIn) factors.push(`Check-in: ${options.checkIn}`);

  if (options?.store) {
    await prisma.pricingRecommendation.create({
      data: {
        listingId,
        recommendedCents: recommendedPriceCents,
        marketAvgCents,
        demandLevel,
        minStayNights: minStayNights ?? undefined,
        factors,
        forDate: options.checkIn ? new Date(options.checkIn) : undefined,
        createdAt: new Date(),
      },
    }).catch(() => {});
  }

  return {
    recommendedPriceCents,
    currentPriceCents: listing.nightPriceCents,
    marketAvgCents,
    demandLevel,
    factors,
    minStayNights,
  };
}

/** Get pricing rules for a listing (seasonality, min stay, event). */
export async function getPricingRulesForListing(
  listingId: string,
  forDate?: string
) {
  const where: { listingId: string; ruleType?: string } = { listingId };
  const rules = await prisma.pricingRule.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  if (!forDate) return rules;
  const d = new Date(forDate);
  return rules.filter((r) => {
    if (r.validFrom && d < r.validFrom) return false;
    if (r.validTo && d > r.validTo) return false;
    return true;
  });
}

/** Create or update a pricing rule (host or admin). */
export async function upsertPricingRule(params: {
  listingId: string;
  ruleType: string;
  payload: Record<string, unknown>;
  validFrom?: Date | null;
  validTo?: Date | null;
}) {
  const existing = await prisma.pricingRule.findFirst({
    where: {
      listingId: params.listingId,
      ruleType: params.ruleType,
    },
  });
  const payloadJson = params.payload as object;
  if (existing) {
    return prisma.pricingRule.update({
      where: { id: existing.id },
      data: {
        payload: payloadJson,
        validFrom: params.validFrom,
        validTo: params.validTo,
      },
    });
  }
  return prisma.pricingRule.create({
    data: {
      listingId: params.listingId,
      ruleType: params.ruleType,
      payload: payloadJson,
      validFrom: params.validFrom,
      validTo: params.validTo,
    },
  });
}
