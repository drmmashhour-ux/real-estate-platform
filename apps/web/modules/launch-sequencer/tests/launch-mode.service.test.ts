import { describe, expect, it } from "vitest";
import { selectLaunchMode } from "../launch-mode.service";
import type { LaunchDependency, LaunchFeatureSubset, LaunchReadinessScore } from "../launch-sequencer.types";

describe("selectLaunchMode", () => {
  it("selects READ_ONLY for not_ready", () => {
    const readiness: LaunchReadinessScore = { score: 25, label: "not_ready", rationale: [] };
    const subset: LaunchFeatureSubset = {
      marketKey: "m",
      enabledFeatures: [],
      restrictedFeatures: [],
      blockedFeatures: ["autonomy"],
      rationale: [],
    };
    const { launchMode } = selectLaunchMode(readiness, [], subset);
    expect(launchMode).toBe("READ_ONLY_INTELLIGENCE");
  });

  it("selects FULL when launch_ready and no blockers", () => {
    const readiness: LaunchReadinessScore = { score: 88, label: "launch_ready", rationale: [] };
    const subset: LaunchFeatureSubset = {
      marketKey: "m",
      enabledFeatures: ["listings"],
      restrictedFeatures: [],
      blockedFeatures: [],
      rationale: [],
    };
    const deps: LaunchDependency[] = [];
    const { launchMode } = selectLaunchMode(readiness, deps, subset);
    expect(launchMode).toBe("FULL_PRODUCTION");
  });
});
