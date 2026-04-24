import { getFunnelSnapshot } from "../context.service";

/**
 * Optimizes first purchase and upsell loops.
 */
export async function runMonetizationOptimization() {
  const snapshot = await getFunnelSnapshot();
  const suggestions: string[] = [];

  if (snapshot.pricingConversion < 0.1) {
    suggestions.push("Offer 50% discount on first lead purchase for new brokers");
    suggestions.push("Upsell premium placement for high-performing listings");
  }

  return { suggestions };
}
