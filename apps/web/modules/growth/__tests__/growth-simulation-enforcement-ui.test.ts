import { describe, it, expect } from "vitest";
import { simulationEnforcementSnapshotDebugLabel } from "../growth-simulation-enforcement-ui";

describe("simulationEnforcementSnapshotDebugLabel", () => {
  it("returns layer_off when enforcement flag is false (parent passes null snapshot)", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: false,
        enforcementSnapshotReady: false,
        enforcementSnapshot: null,
      }),
    ).toBe("layer_off");
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: false,
        enforcementSnapshotReady: true,
        enforcementSnapshot: { foo: true },
      }),
    ).toBe("layer_off");
  });

  it("returns loading_parent while shared snapshot fetch is pending", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: false,
        enforcementSnapshot: null,
      }),
    ).toBe("loading_parent");
  });

  it("returns absent when enforcement is on but shared snapshot did not hydrate", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: null,
      }),
    ).toBe("absent");
  });

  it("returns received when enforcement is on and snapshot exists", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: {
          rules: [],
          blockedTargets: [],
          frozenTargets: [],
          approvalRequiredTargets: [],
          notes: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          inputCompleteness: "complete",
          missingDataWarnings: [],
        },
      }),
    ).toBe("received");
  });
});
