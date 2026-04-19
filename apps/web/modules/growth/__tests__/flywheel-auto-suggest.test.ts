import { describe, expect, it } from "vitest";
import type { MarketplaceFlywheelInsight } from "@/modules/marketplace/flywheel.types";
import type { FlywheelLearningSummary } from "@/modules/growth/flywheel-learning.service";
import type { GrowthActionSuccessProfile } from "@/modules/growth/flywheel-success-suggestions.types";
import { buildAutoSuggestedGrowthActions } from "@/modules/growth/flywheel-auto-suggest.service";

describe("buildAutoSuggestedGrowthActions", () => {
  it("caps suggestions at five and prefers insights with stronger historical profiles", () => {
    const insights: MarketplaceFlywheelInsight[] = [
      {
        id: "ins-broker",
        type: "broker_gap",
        title: "Bench",
        description: "",
        impact: "high",
      },
      {
        id: "ins-demand",
        type: "demand_gap",
        title: "Demand",
        description: "",
        impact: "medium",
      },
      {
        id: "ins-supply",
        type: "supply_gap",
        title: "Supply",
        description: "",
        impact: "medium",
      },
      {
        id: "ins-conv",
        type: "conversion_opportunity",
        title: "Conv",
        description: "",
        impact: "low",
      },
      {
        id: "ins-price",
        type: "pricing_opportunity",
        title: "Price",
        description: "",
        impact: "low",
      },
    ];

    const learning: FlywheelLearningSummary = {
      byInsightType: {},
      actionTypeEffectiveness: [],
    };

    const profiles: GrowthActionSuccessProfile[] = [
      {
        actionType: "broker_acquisition",
        totalActions: 20,
        positiveCount: 10,
        neutralCount: 5,
        negativeCount: 2,
        insufficientCount: 1,
        successRate: 10 / 17,
        confidenceLevel: "high",
        notes: [],
      },
      {
        actionType: "demand_generation",
        totalActions: 8,
        positiveCount: 1,
        neutralCount: 2,
        negativeCount: 4,
        insufficientCount: 1,
        successRate: 1 / 7,
        confidenceLevel: "low",
        notes: [],
      },
    ];

    const bundle = buildAutoSuggestedGrowthActions({
      prioritizedInsights: insights,
      learning,
      profiles,
    });

    expect(bundle.suggestions.length).toBeLessThanOrEqual(5);
    expect(bundle.suggestions[0]?.actionType).toBe("broker_acquisition");
  });

  it("surfaces warnings when history is empty", () => {
    const bundle = buildAutoSuggestedGrowthActions({
      prioritizedInsights: [],
      learning: { byInsightType: {}, actionTypeEffectiveness: [] },
      profiles: [],
    });
    expect(bundle.warnings.length).toBeGreaterThan(0);
  });
});
