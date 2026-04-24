import { describe, expect, it } from "vitest";
import { planMarketFeatureSubset } from "../feature-subset-planner.service";
import type { LaunchDependency, LaunchReadinessScore } from "../launch-sequencer.types";

describe("planMarketFeatureSubset", () => {
  it("blocks autonomy for low readiness with blocking compliance", () => {
    const readiness: LaunchReadinessScore = { score: 30, label: "not_ready", rationale: [] };
    const deps: LaunchDependency[] = [
      {
        key: "c",
        type: "COMPLIANCE",
        title: "Pack",
        severity: "high",
        blocking: true,
        rationale: ["x"],
      },
    ];
    const p = planMarketFeatureSubset("M", readiness, deps);
    expect(p.blockedFeatures).toContain("autonomy");
    expect(p.enabledFeatures).toContain("command_center_summaries");
  });

  it("enables broader slice for high readiness without blockers", () => {
    const readiness: LaunchReadinessScore = { score: 80, label: "launch_ready", rationale: [] };
    const p = planMarketFeatureSubset("M", readiness, []);
    expect(p.enabledFeatures.length).toBeGreaterThan(5);
  });
});
