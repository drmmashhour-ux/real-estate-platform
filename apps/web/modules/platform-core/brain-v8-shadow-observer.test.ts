import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBrainV8ShadowMonitoringSnapshot,
  resetBrainV8ShadowMonitoringForTests,
} from "./brain-v8-shadow-monitoring.service";

const { buildBrainSnapshotMock } = vi.hoisted(() => ({
  buildBrainSnapshotMock: vi.fn(),
}));

vi.mock("@/config/feature-flags", () => ({
  oneBrainV8Flags: {
    brainV8ShadowObservationV1: true,
    brainV8ShadowPersistenceV1: false,
    brainV8InfluenceV1: false,
  },
  platformCoreFlags: { platformCoreV1: true },
  isPlatformCoreAuditEffective: () => false,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    brainShadowObservation: {
      create: vi.fn(),
    },
  },
}));

vi.mock("./platform-core.repository", async (importOriginal) => {
  const m = await importOriginal<typeof import("./platform-core.repository")>();
  return {
    ...m,
    createAuditEvent: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./brain-snapshot.service", () => ({
  buildBrainSnapshot: () => buildBrainSnapshotMock(),
}));

import { runBrainV8ShadowObservationPass } from "./brain-v8-shadow-observer.service";

describe("brain-v8-shadow-observer", () => {
  beforeEach(() => {
    resetBrainV8ShadowMonitoringForTests();
    buildBrainSnapshotMock.mockReset();
  });

  it("returns null when buildBrainSnapshot throws (non-blocking)", async () => {
    buildBrainSnapshotMock.mockRejectedValue(new Error("snapshot unavailable"));
    const r = await runBrainV8ShadowObservationPass();
    expect(r).toBeNull();
    expect(getBrainV8ShadowMonitoringSnapshot().snapshotFail).toBe(1);
  });

  it("returns a result when snapshot succeeds with outcomes", async () => {
    buildBrainSnapshotMock.mockResolvedValue({
      recentOutcomes: [
        {
          id: "1",
          decisionId: "d1",
          source: "ADS",
          entityType: "C",
          entityId: null,
          actionType: "a",
          outcomeType: "POSITIVE",
          outcomeScore: 0.5,
          observedMetrics: null,
          reason: "r",
          createdAt: new Date(),
        },
      ],
      notes: ["n1"],
    });
    const r = await runBrainV8ShadowObservationPass();
    expect(r).not.toBeNull();
    expect(r!.sampleSize).toBe(1);
    expect(r!.aggregate.insufficientEvidenceCount).toBe(0);
  });
});
