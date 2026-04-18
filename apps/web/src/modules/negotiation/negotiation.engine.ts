import { prisma } from "@/lib/db";
import { marketplaceAiV5Flags } from "@/config/feature-flags";
import { suggestInitialOfferRange, suggestCounterRange, type OfferBounds } from "./negotiation.strategy";
import { simulateNegotiationOutcomes } from "./negotiation.simulator";

export type NegotiationRecommendation = {
  suggestedOfferCents: number;
  acceptableRangeCents: { min: number; max: number };
  probabilityOfAcceptance: number;
  confidence: number;
  reasoning: string[];
  fairnessNote: string;
};

async function medianFsboCity(city: string, excludeId?: string): Promise<{ med: number | null; n: number }> {
  const rows = await prisma.fsboListing.findMany({
    where: {
      city: { equals: city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { priceCents: true },
    take: 200,
  });
  const prices = rows.map((r) => r.priceCents).filter((p) => p > 0).sort((a, b) => a - b);
  if (prices.length < 6) return { med: null, n: prices.length };
  const mid = Math.floor(prices.length / 2);
  const med = prices.length % 2 ? prices[mid]! : Math.round((prices[mid - 1]! + prices[mid]!) / 2);
  return { med, n: prices.length };
}

/**
 * FSBO list-price negotiation hints — requires licensed review before submission.
 */
export async function recommendNegotiationForFsboListing(listingId: string): Promise<NegotiationRecommendation | null> {
  if (!marketplaceAiV5Flags.negotiationEngineV1) return null;

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { priceCents: true, city: true, updatedAt: true },
  });
  if (!row) return null;

  const { med, n } = await medianFsboCity(row.city, listingId);
  const bounds: OfferBounds = {
    listPriceCents: row.priceCents,
    medianPeerCents: med,
    peerSampleSize: n,
  };
  const range = suggestInitialOfferRange(bounds);
  const dom = (Date.now() - row.updatedAt.getTime()) / 86400000;
  const sim = simulateNegotiationOutcomes({
    offerCents: range.midCents,
    listCents: row.priceCents,
    daysOnMarketApprox: dom,
  });

  const prob = sim.scenarios.find((s) => s.label === "seller_accepts_or_near")?.probability ?? 0.35;
  const reasoning = [
    `List price ${(row.priceCents / 100).toFixed(0)} in ${row.city}`,
    med ? `Peer median ≈ ${(med / 100).toFixed(0)} (${n} listings)` : "Insufficient peers for median — wide band.",
    ...sim.scenarios.map((s) => `scenario ${s.label}: ${s.probability}`),
  ];

  return {
    suggestedOfferCents: range.midCents,
    acceptableRangeCents: { min: range.lowCents, max: range.highCents },
    probabilityOfAcceptance: prob,
    confidence: med ? 0.55 : 0.32,
    reasoning,
    fairnessNote:
      "Fairness is informational only — binding terms belong in a written offer reviewed by counsel/broker per local law.",
  };
}

export function recommendCounterForOffer(currentOfferCents: number, listPriceCents: number) {
  if (!marketplaceAiV5Flags.negotiationEngineV1) return null;
  return suggestCounterRange(currentOfferCents, listPriceCents);
}
