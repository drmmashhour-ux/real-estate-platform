/**
 * Maps catalog ids to stable recommendation categories for learning aggregates.
 */

import type { GrowthAutonomyRecommendationCategory } from "./growth-autonomy-learning.types";

export function catalogIdToLearningCategory(catalogId: string): GrowthAutonomyRecommendationCategory {
  switch (catalogId) {
    case "cat-strategy-promo":
      return "strategy";
    case "cat-content":
      return "content";
    case "cat-messaging":
      return "messaging";
    case "cat-fusion":
      return "fusion";
    case "cat-simulation":
      return "simulation";
    case "cat-manual-review":
      return "manual_review";
    case "cat-prefill":
      return "operator_assistance";
    default:
      return "generic";
  }
}
