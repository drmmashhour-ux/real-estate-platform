import type { TrustScore } from "./trust.types";
import type { TrustVisibilityImpact } from "./trust.types";

/**
 * Ranking weight adjustment — never removes listings from results (minimum boost ~0.97).
 */
export function computeVisibilityImpact(trustScore: TrustScore): TrustVisibilityImpact {
  try {
    switch (trustScore.level) {
      case "low":
        return { rankingBoost: 0.97, exposureLevel: "limited" };
      case "medium":
        return { rankingBoost: 1, exposureLevel: "normal" };
      case "high":
        return { rankingBoost: 1.025, exposureLevel: "boosted" };
      case "verified":
        return { rankingBoost: 1.045, exposureLevel: "boosted" };
      case "premium":
        return { rankingBoost: 1.06, exposureLevel: "boosted" };
      default:
        return { rankingBoost: 1, exposureLevel: "normal" };
    }
  } catch {
    return { rankingBoost: 1, exposureLevel: "normal" };
  }
}
