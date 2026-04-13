import { prisma } from "@/lib/db";
import { clamp01 } from "./normalize";
import { PRICE_COMPETITIVENESS_MIN_PEER_COUNT } from "./constants";

export type PriceCompetitivenessV1Result = {
  /** 0–100 */
  score: number;
  marketMedian: number | null;
  confidence: "high" | "medium" | "low" | "none";
  explanation: string;
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/**
 * Compare listing price to peers (same city + property type + deal type). Falls back to neutral 50 when data is thin.
 * Never fabricates confidence — logs low-confidence paths via console in server context.
 */
export async function computeFsboPriceCompetitivenessV1(opts: {
  listingId: string;
  city: string;
  propertyType: string | null;
  listingDealType: string;
  priceCents: number;
  bedrooms: number | null;
}): Promise<PriceCompetitivenessV1Result> {
  const neutral: PriceCompetitivenessV1Result = {
    score: 50,
    marketMedian: null,
    confidence: "none",
    explanation: "Insufficient comparable listings — using neutral competitiveness.",
  };

  if (!opts.propertyType?.trim()) {
    console.info("[price-competitiveness-v1] skip: missing propertyType", { listingId: opts.listingId });
    return neutral;
  }

  const peers = await prisma.fsboListing.findMany({
    where: {
      id: { not: opts.listingId },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      city: { equals: opts.city, mode: "insensitive" },
      propertyType: { equals: opts.propertyType, mode: "insensitive" },
      listingDealType: opts.listingDealType,
      ...(opts.bedrooms != null ? { bedrooms: { gte: opts.bedrooms - 1, lte: opts.bedrooms + 1 } } : {}),
    },
    select: { priceCents: true },
    take: 120,
  });

  const prices = peers.map((p) => p.priceCents).filter((n) => n > 0);
  const med = median(prices);

  if (prices.length < PRICE_COMPETITIVENESS_MIN_PEER_COUNT || med == null) {
    console.info("[price-competitiveness-v1] low_peer_count", {
      listingId: opts.listingId,
      peers: prices.length,
      min: PRICE_COMPETITIVENESS_MIN_PEER_COUNT,
    });
    return {
      score: 50,
      marketMedian: med,
      confidence: prices.length >= 2 ? "low" : "none",
      explanation:
        prices.length < PRICE_COMPETITIVENESS_MIN_PEER_COUNT
          ? "Not enough similar listings for a confident market comparison — neutral score."
          : "Limited comparable sales — wide confidence interval.",
    };
  }

  const ratio = opts.priceCents / med;
  // 1.0 = median → 70; cheaper → up to 100; expensive → down
  let score = 70 + (1 - ratio) * 40;
  score = Math.min(100, Math.max(0, score));

  return {
    score: Math.round(score * 100) / 100,
    marketMedian: med,
    confidence: prices.length >= 24 ? "high" : prices.length >= 12 ? "medium" : "low",
    explanation: `Price vs peer median in ${opts.city} (${opts.propertyType}).`,
  };
}

/** Map 0–100 price competitiveness into 0–1 signal for blending (already normalized). */
export function priceScoreToSignal01(score0to100: number): number {
  return clamp01(score0to100 / 100);
}
