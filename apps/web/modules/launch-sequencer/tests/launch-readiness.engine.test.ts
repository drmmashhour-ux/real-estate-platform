import { describe, expect, it } from "vitest";
import { computeLaunchReadiness } from "../launch-readiness.engine";
import type { LaunchCandidateMarket } from "../launch-sequencer.types";

describe("computeLaunchReadiness", () => {
  it("uses conservative priors when dimensions missing", () => {
    const c: LaunchCandidateMarket = { marketKey: "ZZ" };
    const r = computeLaunchReadiness(c);
    expect(r.score).toBeLessThan(55);
    expect(r.label).toBe("not_ready");
    expect(r.rationale.some((x) => /incomplete|conservative/i.test(x))).toBe(true);
  });

  it("labels launch_ready for strong complete profile", () => {
    const c: LaunchCandidateMarket = {
      marketKey: "CA",
      opportunityScore: 90,
      operationalComplexity: 30,
      localizationReadiness: 88,
      complianceReadiness: 90,
      staffingReadiness: 85,
      productReadiness: 88,
      dataConfidence: 82,
    };
    const r = computeLaunchReadiness(c);
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.label).toBe("launch_ready");
  });
});
