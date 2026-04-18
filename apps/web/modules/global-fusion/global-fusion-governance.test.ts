import { describe, expect, it, beforeEach, vi } from "vitest";
import { globalFusionFlags } from "@/config/feature-flags";
import type { GlobalFusionAggregateMonitoringSnapshot } from "./global-fusion-monitoring.service";
import * as Monitoring from "./global-fusion-monitoring.service";
import * as LearningMon from "./global-fusion-learning-monitoring.service";
import * as Weights from "./global-fusion-learning-weights.service";
import * as GovMon from "./global-fusion-governance-monitoring.service";
import {
  evaluateGlobalFusionGovernance,
  tryEvaluateGovernance,
  buildGlobalFusionRollbackSignal,
} from "./global-fusion-governance.service";
import {
  clearGlobalFusionFreezeForTests,
  isFusionLearningFrozen,
} from "./global-fusion-freeze.service";
import {
  getGlobalFusionCurrentWeights,
  GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS,
} from "./global-fusion-learning-weights.service";
import { resetGlobalFusionGovernanceMonitoringForTests } from "./global-fusion-governance-monitoring.service";
import type { GlobalFusionGovernanceStatus } from "./global-fusion.types";

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

function setGovFlags(opts: {
  governance: boolean;
  autoFreeze?: boolean;
  rollbackSignal?: boolean;
}): void {
  const g = globalFusionFlags as {
    globalFusionGovernanceV1: boolean;
    globalFusionAutoFreezeV1: boolean;
    globalFusionAutoRollbackSignalV1: boolean;
  };
  g.globalFusionGovernanceV1 = opts.governance;
  g.globalFusionAutoFreezeV1 = opts.autoFreeze ?? false;
  g.globalFusionAutoRollbackSignalV1 = opts.rollbackSignal ?? false;
}

function resetLearningFlags(): void {
  const gf = globalFusionFlags as {
    globalFusionLearningV1: boolean;
    globalFusionLearningAdaptiveWeightsV1: boolean;
  };
  gf.globalFusionLearningV1 = false;
  gf.globalFusionLearningAdaptiveWeightsV1 = false;
}

function baseMon(over: Partial<GlobalFusionAggregateMonitoringSnapshot> = {}): GlobalFusionAggregateMonitoringSnapshot {
  const runsTotal = over.runsTotal ?? 20;
  const runsPrimary = over.runsPrimary ?? 15;
  const runsFallback = over.runsFallback ?? 1;
  const runsSourceAdvisoryDefault = over.runsSourceAdvisoryDefault ?? 0;
  const c = over.counters;
  return {
    runsTotal,
    runsPrimary,
    runsFallback,
    runsSourceAdvisoryDefault,
    fallbackRate: over.fallbackRate ?? 0.05,
    systemsCoverage: over.systemsCoverage ?? { brain: 0.25, ads: 0.25, cro: 0.25, ranking: 0.25 },
    missingSourceRate: over.missingSourceRate ?? 0.1,
    conflictRate: over.conflictRate ?? 0.2,
    disagreementRate: over.disagreementRate ?? 0.2,
    lowEvidenceRate: over.lowEvidenceRate ?? 0.2,
    influenceAppliedRate: over.influenceAppliedRate ?? 0.5,
    influenceSkippedRate: over.influenceSkippedRate ?? 0.5,
    unstableOrderingRate: over.unstableOrderingRate ?? 0.05,
    anomalyRate: over.anomalyRate ?? 0.05,
    malformedInputRate: over.malformedInputRate ?? 0.02,
    emptyOutputRate: over.emptyOutputRate ?? 0,
    counters: {
      runsTotal,
      runsPrimary,
      runsFallback,
      runsSourceAdvisoryDefault,
      missingSourceRuns: c?.missingSourceRuns ?? 0,
      highConflictRuns: c?.highConflictRuns ?? 0,
      highDisagreementRuns: c?.highDisagreementRuns ?? 0,
      lowEvidenceRuns: c?.lowEvidenceRuns ?? 0,
      emptyOutputRuns: c?.emptyOutputRuns ?? 0,
      malformedInputRuns: c?.malformedInputRuns ?? 0,
      influenceAppliedRuns: c?.influenceAppliedRuns ?? 0,
      influenceSkippedRuns: c?.influenceSkippedRuns ?? 0,
      unstableOrderingRuns: c?.unstableOrderingRuns ?? 0,
      anomalyRuns: c?.anomalyRuns ?? 0,
      warningSamples: c?.warningSamples ?? 0,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

describe("global-fusion-governance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearGlobalFusionFreezeForTests();
    resetGlobalFusionGovernanceMonitoringForTests();
    resetLearningFlags();
    setGovFlags({ governance: true, autoFreeze: false, rollbackSignal: false });
    vi.spyOn(Monitoring, "getGlobalFusionMonitoringSnapshot").mockReturnValue(baseMon());
    vi.spyOn(LearningMon, "getLastLearningSummary").mockReturnValue(null);
    vi.spyOn(Weights, "getWeightDriftFromDefaultL1").mockReturnValue(0.01);
    vi.spyOn(GovMon, "getConsecutiveCautionOrWorse").mockReturnValue(0);
  });

  it("returns governance disabled snapshot when GOVERNANCE_V1 is off", () => {
    setGovFlags({ governance: false });
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.governanceEnabled).toBe(false);
    expect(snap.status.notes.some((n) => n.includes("GOVERNANCE_V1_off"))).toBe(true);
  });

  it("healthy metrics yield healthy decision with baseline note", () => {
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 20, fallbackRate: 0.04, anomalyRate: 0.04 }),
    );
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("healthy");
    expect(snap.status.notes).toContain("all_metrics_within_baseline");
  });

  it("insufficient runs (<2) yields watch without throwing", () => {
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 1, fallbackRate: 0, anomalyRate: 0 }),
    );
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("watch");
    expect(snap.status.reasons).toContain("runs_lt_2");
  });

  it("moderate fallback breach yields caution", () => {
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 20, fallbackRate: 0.4 }),
    );
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("caution");
    expect(snap.status.reasons.some((r) => r.includes("fallback"))).toBe(true);
  });

  it("strong sustained fallback yields rollback_recommended when consecutive gate passes", () => {
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 15, fallbackRate: 0.55 }),
    );
    vi.mocked(GovMon.getConsecutiveCautionOrWorse).mockReturnValue(4);
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("rollback_recommended");
  });

  it("severe anomaly yields require_human_review", () => {
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 15, fallbackRate: 0.05, anomalyRate: 0.45 }),
    );
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("require_human_review");
  });

  it("poor learning proxy (hit rate) yields caution", () => {
    vi.mocked(LearningMon.getLastLearningSummary).mockReturnValue({
      runs: 3,
      signalsEvaluated: 10,
      outcomesLinked: 2,
      accuracyEstimate: 0.3,
      recommendationHitRate: 0.35,
      falsePositiveRate: 0.2,
      falseNegativeRate: null,
      weightAdjustments: [],
      warnings: [],
      skipped: false,
    });
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("caution");
    expect(snap.status.reasons).toContain("low_learning_proxy_accuracy");
  });

  it("weight drift above freeze threshold recommends freeze; auto-freeze OFF does not apply", () => {
    vi.mocked(Weights.getWeightDriftFromDefaultL1).mockReturnValue(0.14);
    setGovFlags({ governance: true, autoFreeze: false });
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("freeze_learning_recommended");
    expect(snap.status.freezeDecision?.learningFreezeRecommended).toBe(true);
    expect(isFusionLearningFrozen()).toBe(false);
  });

  it("auto-freeze ON applies Fusion-local learning freeze", () => {
    vi.mocked(Weights.getWeightDriftFromDefaultL1).mockReturnValue(0.14);
    setGovFlags({ governance: true, autoFreeze: true });
    const snap = evaluateGlobalFusionGovernance();
    expect(["freeze_learning_applied", "freeze_learning_recommended"]).toContain(snap.status.decision);
    expect(isFusionLearningFrozen()).toBe(true);
  });

  it("Fusion-local freeze forces adaptive weight readers to defaults when learning flags are on", () => {
    const gf = globalFusionFlags as {
      globalFusionLearningV1: boolean;
      globalFusionLearningAdaptiveWeightsV1: boolean;
    };
    gf.globalFusionLearningV1 = true;
    gf.globalFusionLearningAdaptiveWeightsV1 = true;
    vi.mocked(Weights.getWeightDriftFromDefaultL1).mockReturnValue(0.14);
    setGovFlags({ governance: true, autoFreeze: true });
    evaluateGlobalFusionGovernance();
    expect(getGlobalFusionCurrentWeights()).toEqual(GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS);
  });

  it("rollback signal is null when AUTO_ROLLBACK_SIGNAL_V1 is off", () => {
    setGovFlags({ governance: true, rollbackSignal: false });
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 15, fallbackRate: 0.55 }),
    );
    vi.mocked(GovMon.getConsecutiveCautionOrWorse).mockReturnValue(4);
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.decision).toBe("rollback_recommended");
    expect(snap.status.rollbackSignal).toBeUndefined();
  });

  it("rollback signal is present when AUTO_ROLLBACK_SIGNAL_V1 is on", () => {
    setGovFlags({ governance: true, rollbackSignal: true });
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockReturnValue(
      baseMon({ runsTotal: 15, fallbackRate: 0.55 }),
    );
    vi.mocked(GovMon.getConsecutiveCautionOrWorse).mockReturnValue(4);
    const snap = evaluateGlobalFusionGovernance();
    expect(snap.status.rollbackSignal?.level).toBe("rollback_recommended");
    expect(snap.status.rollbackSignal?.formal).toBe(true);
  });

  it("buildGlobalFusionRollbackSignal maps decisions to levels", () => {
    setGovFlags({ governance: true, rollbackSignal: true });
    const status: GlobalFusionGovernanceStatus = {
      decision: "caution",
      recommendation: "test",
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
      reasons: ["r1"],
      notes: [],
    };
    const sig = buildGlobalFusionRollbackSignal(status);
    expect(sig?.level).toBe("caution");
  });

  it("tryEvaluateGovernance swallows errors from dependencies", () => {
    setGovFlags({ governance: true });
    vi.mocked(Monitoring.getGlobalFusionMonitoringSnapshot).mockImplementation(() => {
      throw new Error("boom");
    });
    expect(() => tryEvaluateGovernance()).not.toThrow();
  });
});
