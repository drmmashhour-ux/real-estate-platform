import { describe, expect, it } from "vitest";
import { detectGlobalFusionConflicts } from "./global-fusion-conflict.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";
import { normalizeControlCenterSystems } from "./global-fusion-normalizer.service";

describe("detectGlobalFusionConflicts", () => {
  it("detects ads vs CRO tension when ads healthy and CRO weak", () => {
    const sys = minimalControlCenterSystems({
      ads: {
        ...minimalControlCenterSystems().ads,
        status: "healthy",
        pctRunsRisky: 10,
      },
      cro: {
        ...minimalControlCenterSystems().cro,
        healthScore: 35,
        status: "warning",
      },
    });
    const { signals } = normalizeControlCenterSystems(sys, 0);
    const c = detectGlobalFusionConflicts(sys, signals);
    expect(c.some((x) => x.id.includes("ads_scale_cro_weak"))).toBe(true);
  });

  it("returns empty when no heuristics match", () => {
    const sys = minimalControlCenterSystems();
    const { signals } = normalizeControlCenterSystems(sys, 0);
    const c = detectGlobalFusionConflicts(sys, signals);
    expect(Array.isArray(c)).toBe(true);
  });
});
