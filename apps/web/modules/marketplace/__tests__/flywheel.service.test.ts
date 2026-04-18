import { describe, expect, it } from "vitest";
import {
  buildFlywheelActions,
  prioritizeFlywheelInsights,
} from "@/modules/marketplace/flywheel.service";
import type { MarketplaceFlywheelInsight } from "@/modules/marketplace/flywheel.types";

describe("flywheel.service", () => {
  it("prioritizes high impact first", () => {
    const insights: MarketplaceFlywheelInsight[] = [
      {
        id: "a",
        type: "demand_gap",
        title: "Low",
        description: "d",
        impact: "low",
      },
      {
        id: "b",
        type: "broker_gap",
        title: "High",
        description: "d",
        impact: "high",
      },
    ];
    const p = prioritizeFlywheelInsights(insights);
    expect(p[0]!.impact).toBe("high");
  });

  it("buildFlywheelActions returns deterministic suggestions", () => {
    const actions = buildFlywheelActions([
      {
        id: "1",
        type: "broker_gap",
        title: "t",
        description: "d",
        impact: "medium",
      },
    ]);
    expect(actions.some((a) => a.toLowerCase().includes("broker"))).toBe(true);
  });

  it("buildFlywheelActions falls back when no insights", () => {
    const actions = buildFlywheelActions([]);
    expect(actions.length).toBeGreaterThan(0);
  });
});
