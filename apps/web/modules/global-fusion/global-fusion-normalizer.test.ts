import { describe, expect, it } from "vitest";
import { normalizeControlCenterSystems } from "./global-fusion-normalizer.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";

describe("normalizeControlCenterSystems", () => {
  it("produces four signals with provenance and does not throw on minimal systems", () => {
    const sys = minimalControlCenterSystems();
    const { signals, malformedWarnings } = normalizeControlCenterSystems(sys, 1000);
    expect(malformedWarnings.length).toBe(0);
    expect(signals.length).toBe(4);
    expect(signals.map((s) => s.source).sort()).toEqual(["ads", "brain", "cro", "ranking"].sort());
    expect(signals.every((s) => s.provenance.includes("ai_control_center"))).toBe(true);
  });

  it("handles null systems", () => {
    const { signals, missingSources } = normalizeControlCenterSystems(null, null);
    expect(signals.length).toBe(0);
    expect(missingSources).toContain("control_center:systems_null");
  });
});
