import { describe, expect, it, vi } from "vitest";

const buildBrainSnapshotMock = vi.fn().mockResolvedValue({ recentOutcomes: [], notes: [] });

vi.mock("@/config/feature-flags", () => ({
  oneBrainV8Flags: {
    brainV8ShadowObservationV1: false,
    brainV8ShadowPersistenceV1: false,
    brainV8InfluenceV1: false,
    brainV8PrimaryV1: false,
  },
  platformCoreFlags: { platformCoreV1: true },
  isPlatformCoreAuditEffective: () => false,
}));

vi.mock("./brain-snapshot.service", () => ({
  buildBrainSnapshot: () => buildBrainSnapshotMock(),
}));

import { runBrainV8ShadowObservationPass } from "./brain-v8-shadow-observer.service";

describe("brain-v8-shadow flag gating", () => {
  it("returns null when FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1 is off (no snapshot call)", async () => {
    const r = await runBrainV8ShadowObservationPass();
    expect(r).toBeNull();
    expect(buildBrainSnapshotMock).not.toHaveBeenCalled();
  });
});
