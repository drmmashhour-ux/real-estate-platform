import { prisma } from "@/lib/db";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { simulateOfferStrategy } from "@/src/modules/offer-strategy-simulator/application/simulateOfferStrategy";
import type { OfferScenarioInput } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export async function resolveDemoPropertyId(explicit?: string | null): Promise<string | null> {
  if (explicit?.trim()) return explicit.trim();
  const envId = process.env.GROWTH_FIRST_VALUE_LISTING_ID?.trim();
  if (envId) return envId;
  const first = await prisma.fsboListing.findFirst({
    where: { status: "PUBLISHED" },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return first?.id ?? null;
}

export function buildDefaultScenarioInput(propertyId: string, listPriceCents: number): OfferScenarioInput {
  const offerPriceCents = Math.max(1000, Math.round(listPriceCents * 0.98));
  const deposit = Math.round(offerPriceCents * 0.05);
  return {
    propertyId,
    offerPriceCents,
    depositAmountCents: deposit,
    financingCondition: true,
    inspectionCondition: true,
    documentReviewCondition: true,
    occupancyDate: null,
    signatureDate: null,
    userStrategyMode: "first_value",
  };
}

export async function runFirstValueSimulation(args: { propertyId?: string | null; userId: string | null }) {
  const propertyId = await resolveDemoPropertyId(args.propertyId);
  if (!propertyId) {
    return { ok: false as const, error: "No listing available. Set GROWTH_FIRST_VALUE_LISTING_ID or publish an FSBO listing." };
  }

  const access = await assertFsboListingAccessibleForPhase3(propertyId, args.userId);
  if (!access.ok) {
    return { ok: false as const, error: "Listing not available for simulation." };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: propertyId },
    select: { priceCents: true },
  });
  if (!listing?.priceCents) {
    return { ok: false as const, error: "Listing price unavailable." };
  }

  const input = buildDefaultScenarioInput(propertyId, listing.priceCents);
  const out = await simulateOfferStrategy(input);
  if (!out.ok) return { ok: false as const, error: out.error };

  return {
    ok: true as const,
    propertyId,
    input,
    result: out.result,
    summary: {
      riskBand: String(out.result.riskImpact.band),
      nextActions: out.result.nextActions.slice(0, 3),
      recommendation: out.result.recommendedStrategy,
    },
  };
}
