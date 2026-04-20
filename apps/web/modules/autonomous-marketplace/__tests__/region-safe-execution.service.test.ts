import { beforeEach, describe, expect, it, vi } from "vitest";

const engineFlagsRef = {
  regionAwareExecutionV1: true,
  regionAwareAutonomyV1: true,
  syriaLiveExecutionV1: false,
};

vi.mock("@/config/feature-flags", () => ({
  engineFlags: engineFlagsRef,
}));

describe("region-safe-execution.service", () => {
  beforeEach(async () => {
    vi.resetModules();
    engineFlagsRef.regionAwareExecutionV1 = true;
    engineFlagsRef.regionAwareAutonomyV1 = true;
    engineFlagsRef.syriaLiveExecutionV1 = false;
  });

  it("blocks Syria live execution when SYRIA live flag is off", async () => {
    const { canRegionExecuteAction } = await import("../execution/region-safe-execution.service");
    const r = canRegionExecuteAction({
      regionCode: "sy",
      source: "syria",
      actionType: "CREATE_TASK",
    });
    expect(r.allowed).toBe(false);
    expect(r.reasons).toContain("region_capability_block");
  });

  it("does not throw for unknown region codes", async () => {
    const { canRegionExecuteAction } = await import("../execution/region-safe-execution.service");
    const r = canRegionExecuteAction({
      regionCode: "zz_unknown",
      actionType: "CREATE_TASK",
    });
    expect(["full", "recommend_only", "blocked"]).toContain(r.profile.executionMode);
  });

  it("getRegionExecutionAvailabilityNote returns stable admin copy", async () => {
    const { getRegionExecutionAvailabilityNote } = await import("../execution/region-safe-execution.service");
    const s = getRegionExecutionAvailabilityNote({ regionCode: "sy", source: "syria", actionType: "FLAG_REVIEW" });
    expect(s.length).toBeGreaterThan(10);
  });
});
