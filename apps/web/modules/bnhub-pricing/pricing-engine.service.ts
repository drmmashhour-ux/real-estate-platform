import { prisma } from "@/lib/db";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import { getPricingRulesForListing } from "@/lib/bnhub/pricing";
import type { BnhubPricingSuggestion } from "./pricing-engine.types";
import { computePriceGuardrailsCents } from "./price-optimizer.service";

/**
 * Unified pricing intelligence output — suggestions only; host must confirm apply via existing APIs.
 */
export async function buildBnhubPricingSuggestion(
  listingId: string,
  checkIn?: string,
): Promise<BnhubPricingSuggestion | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, nightPriceCents: true, ownerId: true },
  });
  if (!listing) return null;

  const [smart, rules, rails] = await Promise.all([
    generateSmartPrice(listingId),
    getPricingRulesForListing(listingId, checkIn),
    computePriceGuardrailsCents(listing.ownerId, listing.nightPriceCents),
  ]);

  const reasons: string[] = [
    `Peer sample: ${smart.peerListingCount} listings in market; bookings(last30)/peer ≈ demand signal.`,
    `Seasonality ×${smart.factors.seasonality.toFixed(2)}; demand ratio ${smart.factors.demandRatio.toFixed(3)}.`,
  ];
  for (const r of rules.slice(0, 4)) {
    reasons.push(`Rule ${r.ruleType} active.`);
  }
  reasons.push("Guardrails respect Host autopilot min/max when configured.");

  const conf =
    smart.confidence === "high" ? 0.85 : smart.confidence === "medium" ? 0.6 : 0.4;

  let suggested = smart.recommendedPriceCents;
  suggested = Math.max(rails.minPriceCents, Math.min(rails.maxPriceCents, suggested));

  return {
    suggestedPriceCents: suggested,
    minPriceCents: rails.minPriceCents,
    maxPriceCents: rails.maxPriceCents,
    confidence: conf,
    confidenceLabel: smart.confidence,
    reasons,
  };
}
