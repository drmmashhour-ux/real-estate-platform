import { describe, expect, it } from "vitest";
import { computeLaunchRiskProfile } from "../launch-risk.engine";
import type { LaunchDependency, LaunchReadinessScore } from "../launch-sequencer.types";

describe("computeLaunchRiskProfile", () => {
  it("elevates overall risk with low readiness", () => {
    const readiness: LaunchReadinessScore = { score: 30, label: "not_ready", rationale: [] };
    const r = computeLaunchRiskProfile("MK", readiness, []);
    expect(["high", "medium"]).toContain(r.overallRisk);
  });

  it("includes compliance risk when high severity compliance deps exist", () => {
    const readiness: LaunchReadinessScore = { score: 70, label: "limited_launch_ready", rationale: [] };
    const deps: LaunchDependency[] = [
      {
        key: "x",
        type: "COMPLIANCE",
        title: "t",
        severity: "high",
        blocking: true,
        rationale: [],
      },
    ];
    const r = computeLaunchRiskProfile("MK", readiness, deps);
    expect(r.risks.some((x) => x.key === "compliance_ambiguity")).toBe(true);
  });
});
