import type { RevenueTier } from "@/lib/ai/lead-score";

/**
 * Internal “list price” for a lead in cents (CAD) — reporting & future paywalls.
 * Tier × location demand × base.
 */
export function computeDynamicLeadPriceCents(
  tier: RevenueTier,
  locationRaw: string | undefined,
  baseCents = 4_900
): number {
  const tierMult = tier === "HIGH" ? 1.55 : tier === "MEDIUM" ? 1.0 : 0.5;
  const loc = (locationRaw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const cityDemand: Record<string, number> = {
    montreal: 1.32,
    toronto: 1.38,
    vancouver: 1.34,
    calgary: 1.12,
    ottawa: 1.08,
    quebec: 1.06,
    gatineau: 1.05,
  };

  let demand = 0.88;
  for (const [city, mult] of Object.entries(cityDemand)) {
    if (loc.includes(city)) {
      demand = mult;
      break;
    }
  }

  return Math.max(99, Math.round(baseCents * tierMult * demand));
}

export function estimateMortgageLeadValueCad(params: {
  purchasePrice?: number;
  downPayment?: number;
}): number {
  const { purchasePrice, downPayment } = params;
  if (purchasePrice != null && Number.isFinite(purchasePrice) && purchasePrice > 0) {
    return Math.round(purchasePrice);
  }
  if (downPayment != null && Number.isFinite(downPayment) && downPayment > 0) {
    return Math.round(downPayment * 5);
  }
  return 0;
}
