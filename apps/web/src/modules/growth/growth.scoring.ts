/**
 * growthOpportunityScore = weighted sum of inventory_strength, conversion_potential, engagement_signal,
 * trust_quality, freshness, business_priority — normalized 0..100.
 */
export function computeGrowthOpportunityScore01(input: {
  inventoryStrength01: number;
  conversionPotential01: number;
  engagement01: number;
  trustQuality01: number;
  freshness01: number;
  businessPriority01: number;
}): number {
  const w = {
    inventoryStrength01: 0.22,
    conversionPotential01: 0.2,
    engagement01: 0.16,
    trustQuality01: 0.18,
    freshness01: 0.14,
    businessPriority01: 0.1,
  };
  let s = 0;
  for (const k of Object.keys(w) as (keyof typeof w)[]) {
    const v = Math.max(0, Math.min(1, Number(input[k]) || 0));
    s += v * w[k];
  }
  return Math.max(0, Math.min(1, s));
}

export function toScore100(x01: number): number {
  return Math.round(Math.max(0, Math.min(1, x01)) * 100);
}
