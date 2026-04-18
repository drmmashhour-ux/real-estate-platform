import { describe, it, expect } from "vitest";
import { simulationEnforcementSnapshotDebugLabel } from "../growth-simulation-enforcement-ui";

describe("simulationEnforcementSnapshotDebugLabel", () => {
  it("covers enforcement off, loading, received, absent", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: false,
        enforcementSnapshotReady: true,
        enforcementSnapshot: null,
      }),
    ).toBe("layer_off");

    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: false,
        enforcementSnapshot: null,
      }),
    ).toBe("loading_parent");

    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: { rules: [] },
      }),
    ).toBe("received");

    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: null,
      }),
    ).toBe("absent");
  });
});
