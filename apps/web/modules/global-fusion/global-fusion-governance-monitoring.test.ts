import { describe, expect, it, beforeEach } from "vitest";
import type { GlobalFusionGovernanceSnapshot, GlobalFusionGovernanceStatus } from "./global-fusion.types";
import {
  getGovernanceMonitoringSummary,
  recordGovernanceEvaluation,
  resetGlobalFusionGovernanceMonitoringForTests,
} from "./global-fusion-governance-monitoring.service";

function minimalSnap(over: Partial<GlobalFusionGovernanceStatus> = {}): GlobalFusionGovernanceSnapshot {
  const base: GlobalFusionGovernanceStatus = {
    decision: "healthy",
    recommendation: "ok",
    warnings: [],
    metrics: {
      fallbackRate: 0,
      missingSourceRate: 0,
      conflictRate: 0,
      disagreementRate: 0,
      lowEvidenceRate: 0,
      influenceAppliedRate: null,
      anomalyRate: 0,
      learningAccuracy: null,
      calibrationQuality: null,
      weightDrift: 0,
    },
    thresholdState: {
      fallbackBreached: false,
      missingSourceBreached: false,
      conflictBreached: false,
      disagreementBreached: false,
      lowEvidenceBreached: false,
      anomalyBreached: false,
      unstableOrderingBreached: false,
      weightDriftBreached: false,
      learningQualityBreached: false,
      malformedBreached: false,
    },
    reasons: [],
    notes: [],
    ...over,
  };
  return {
    evaluatedAt: new Date().toISOString(),
    status: base,
    governanceEnabled: true,
    autoFreezeEnabled: false,
    autoRollbackSignalEnabled: false,
  };
}

describe("global-fusion-governance-monitoring", () => {
  beforeEach(() => {
    resetGlobalFusionGovernanceMonitoringForTests();
  });

  it("records evaluations", () => {
    recordGovernanceEvaluation(minimalSnap({ decision: "rollback_recommended" }));
    const s = getGovernanceMonitoringSummary();
    expect(s.evaluationsCount).toBe(1);
    expect(s.rollbackRecommendationsCount).toBe(1);
  });
});
