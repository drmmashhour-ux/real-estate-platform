/**
 * Dynamic Pricing Intelligence – AI-driven nightly price, range, min stay, demand level.
 * Uses historical booking prices, occupancy, market, seasonality. Exposed to host dashboard and APIs.
 */
import { prisma } from "@/lib/db";
import { getPricingRecommendation } from "@/lib/bnhub/pricing";

const PRICING_MODEL_VERSION = "pricing_v1";

export type AiPricingOutput = {
  recommendedCents: number;
  minCents: number;
  maxCents: number;
  demandLevel: "low" | "medium" | "high";
  minStayNights?: number;
  factors: string[];
  modelVersion: string;
};

/**
 * Get AI pricing recommendation for a listing (uses existing pricing lib + stores in AiPricingRecommendation).
 */
export async function getAiPricingRecommendation(
  listingId: string,
  options?: { checkIn?: string; checkOut?: string; store?: boolean }
): Promise<AiPricingOutput> {
  const rec = await getPricingRecommendation(listingId, {
    checkIn: options?.checkIn,
    checkOut: options?.checkOut,
    store: false,
  });
  const rangePct = 0.15;
  const minCents = Math.round(rec.recommendedPriceCents * (1 - rangePct));
  const maxCents = Math.round(rec.recommendedPriceCents * (1 + rangePct));
  const factors = rec.factors;

  if (options?.store !== false) {
    await prisma.aiPricingRecommendation.create({
      data: {
        listingId,
        recommendedCents: rec.recommendedPriceCents,
        minCents,
        maxCents,
        demandLevel: rec.demandLevel,
        minStayNights: rec.minStayNights ?? undefined,
        factors: factors as object,
        modelVersion: PRICING_MODEL_VERSION,
        forDate: options?.checkIn ? new Date(options.checkIn) : undefined,
      },
    }).catch(() => {});
  }

  return {
    recommendedCents: rec.recommendedPriceCents,
    minCents,
    maxCents,
    demandLevel: rec.demandLevel,
    minStayNights: rec.minStayNights,
    factors,
    modelVersion: PRICING_MODEL_VERSION,
  };
}

/** Get latest stored AI pricing recommendation for listing. */
export async function getLatestAiPricingRecommendation(listingId: string) {
  return prisma.aiPricingRecommendation.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
}

/** List recent AI pricing recommendations (admin/analytics). */
export async function listAiPricingRecommendations(params: {
  listingId?: string;
  limit?: number;
}) {
  const where = params.listingId ? { listingId: params.listingId } : {};
  return prisma.aiPricingRecommendation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}
