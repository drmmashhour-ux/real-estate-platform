/**
 * Phase G — Executive operating layer: company-level Fusion summaries (read-only).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { buildGlobalFusionPrimarySurface } from "./global-fusion-primary.service";
import { getGlobalFusionMonitoringSnapshot } from "./global-fusion-monitoring.service";
import type { GlobalFusionAggregateMonitoringSnapshot } from "./global-fusion-monitoring.service";
import { getLastGovernanceSnapshot } from "./global-fusion-governance-monitoring.service";
import { getLastLearningSummary, getGlobalFusionLearningHealthSnapshot } from "./global-fusion-learning-monitoring.service";
import { getGlobalFusionFreezeState } from "./global-fusion-freeze.service";
import { buildExecutivePrioritiesFromAssembly, clusterExecutiveThemes } from "./global-fusion-executive-priority.service";
import { buildExecutiveRisksAndBlockers } from "./global-fusion-executive-risk.service";
import {
  recordExecutiveSummaryGenerated,
  recordExecutiveSummaryFailure,
} from "./global-fusion-executive-monitoring.service";
import { maybePersistExecutiveSnapshot } from "./global-fusion-executive-persistence.service";
import type {
  GlobalFusionExecutiveAssemblyInput,
  GlobalFusionExecutiveHealthSummary,
  GlobalFusionExecutiveMonitoringInput,
  GlobalFusionExecutiveNarrativeBlock,
  GlobalFusionExecutiveOpportunity,
  GlobalFusionExecutiveReadiness,
  GlobalFusionExecutiveRolloutSummary,
  GlobalFusionExecutiveSummary,
  GlobalFusionPayload,
  GlobalFusionPrimarySurfaceResult,
} from "./global-fusion.types";

export function monitoringSnapshotToExecutiveInput(m: GlobalFusionAggregateMonitoringSnapshot): GlobalFusionExecutiveMonitoringInput {
  return {
    runsTotal: m.runsTotal,
    fallbackRate: m.fallbackRate,
    missingSourceRate: m.missingSourceRate,
    conflictRate: m.conflictRate,
    disagreementRate: m.disagreementRate,
    lowEvidenceRate: m.lowEvidenceRate,
    anomalyRate: m.anomalyRate,
    unstableOrderingRate: m.unstableOrderingRate,
    malformedInputRate: m.malformedInputRate,
  };
}

function buildExecutiveOpportunities(payload: GlobalFusionPayload): GlobalFusionExecutiveOpportunity[] {
  const snap = payload.snapshot;
  if (!snap) return [];
  return snap.opportunities.slice(0, 6).map((o) => ({
    id: o.id,
    title: o.title,
    summary: o.rationale,
    sourceSystems: o.systems,
    confidence: o.confidence,
    rationale: o.rationale,
  }));
}

function buildRolloutSummary(
  primary: GlobalFusionPrimarySurfaceResult | null,
  input: GlobalFusionExecutiveAssemblyInput,
): GlobalFusionExecutiveRolloutSummary {
  return {
    pathLabel: primary?.path ?? "unknown",
    primaryActive: primary?.primarySurfaceActive ?? false,
    fallbackRate: input.monitoring.fallbackRate,
    missingSourceRate: input.monitoring.missingSourceRate,
    conflictRate: input.monitoring.conflictRate,
    governanceDecision: input.governanceSnapshot?.status.decision ?? null,
  };
}

function buildHealthExecutive(payload: GlobalFusionPayload, agreement: number | null): GlobalFusionExecutiveHealthSummary {
  const h = payload.health;
  return {
    overallStatus: h.overallStatus,
    observationalWarnings: h.observationalWarnings.slice(0, 12),
    insufficientEvidenceCount: h.insufficientEvidenceCount,
    missingSourceCount: h.missingSourceCount,
    fusedAgreementApprox: agreement,
  };
}

function deriveReadiness(input: GlobalFusionExecutiveAssemblyInput, riskCountHigh: number): GlobalFusionExecutiveReadiness {
  const factors: string[] = [];
  const g = input.governanceSnapshot?.status;
  if (g && g.decision !== "healthy" && g.decision !== "watch") {
    factors.push(`governance:${g.decision}`);
  }
  if (input.monitoring.fallbackRate >= 0.35) factors.push("elevated_fallback");
  if (input.monitoring.missingSourceRate >= 0.4) factors.push("missing_sources");
  if (input.freezeState.learningFrozen || input.freezeState.influenceFrozen) factors.push("fusion_freeze_active");
  if (input.fusionPayload.health.missingSourceCount > 2) factors.push("missing_sources_health");

  let label: GlobalFusionExecutiveReadiness["label"] = "strong";
  if (factors.length >= 3 || riskCountHigh >= 2) label = "at_risk";
  else if (factors.length >= 2 || riskCountHigh >= 1) label = "limited";
  else if (factors.length === 1) label = "moderate";

  const summary =
    label === "strong"
      ? "Cross-system advisory signals are within expected Fusion-local bounds (observational)."
      : label === "moderate"
        ? "Some Fusion-local factors suggest closer monitoring before broad rollout moves."
        : label === "limited"
          ? "Readiness is constrained by stability, evidence, or governance signals — review priorities before expansion."
          : "Readiness is materially constrained — governance and evidence gaps should be reviewed explicitly.";

  return { label, summary, factors };
}

function deriveOverallStatus(
  input: GlobalFusionExecutiveAssemblyInput,
  highRisks: number,
): GlobalFusionExecutiveSummary["overallStatus"] {
  const g = input.governanceSnapshot?.status.decision;
  if (g === "rollback_recommended" || g === "require_human_review") return "degraded";
  if (highRisks >= 2 || input.monitoring.fallbackRate >= 0.45) return "degraded";
  if (g === "caution" || g === "freeze_learning_recommended" || g === "freeze_learning_applied" || highRisks >= 1) {
    return "caution";
  }
  if (g === "watch" || input.monitoring.runsTotal < 3) return "watch";
  return "healthy";
}

function buildNarrativeBlocks(
  readiness: GlobalFusionExecutiveReadiness,
  priorities: { title: string; theme: string }[],
  risks: { title: string; severity: string }[],
): GlobalFusionExecutiveNarrativeBlock[] {
  const blocks: GlobalFusionExecutiveNarrativeBlock[] = [];
  blocks.push({
    id: "n1",
    headline: "Company readiness (Fusion-local)",
    body: readiness.summary,
    relatedThemes: ["launch_readiness", "stability_first"],
  });
  if (priorities[0]) {
    blocks.push({
      id: "n2",
      headline: "Top directional signal",
      body: `${priorities[0].title} — theme ${priorities[0].theme} (advisory, source-grounded).`,
      relatedThemes: ["growth_acceleration", "governance_attention"],
    });
  }
  if (risks[0]?.severity === "high") {
    blocks.push({
      id: "n3",
      headline: "Attention area",
      body: `${risks[0].title}: elevated severity in Fusion executive risk scan (observational).`,
      relatedThemes: ["stability_first", "governance_attention"],
    });
  }
  return blocks.slice(0, 4);
}

/**
 * Pure assembly from bundled inputs — deterministic; safe for tests.
 */
export function buildGlobalFusionExecutiveSummaryFromAssembly(
  input: GlobalFusionExecutiveAssemblyInput,
  primary: GlobalFusionPrimarySurfaceResult | null,
): GlobalFusionExecutiveSummary {
  const priorities = buildExecutivePrioritiesFromAssembly(input);
  const { risks, blockers } = buildExecutiveRisksAndBlockers(input);
  const themes = clusterExecutiveThemes(priorities);
  const opportunities = buildExecutiveOpportunities(input.fusionPayload);
  const agreement = input.fusionPayload.snapshot?.scores.agreementScore ?? null;
  const healthSummary = buildHealthExecutive(input.fusionPayload, agreement);
  const rolloutSummary = buildRolloutSummary(primary, input);
  const highRisks = risks.filter((r) => r.severity === "high").length;
  const readiness = deriveReadiness(input, highRisks);
  const overallStatus = deriveOverallStatus(input, highRisks);
  const notes: string[] = [];
  if (input.monitoring.runsTotal < 3) notes.push("weak_monitoring_runs_executive_caution");
  if (!input.fusionPayload.snapshot) notes.push("no_fusion_snapshot_executive_degraded");
  if (input.monitoring.missingSourceRate >= 0.35) notes.push("missing_source_degradation");

  const provenance = {
    generatedAt: new Date().toISOString(),
    fusionV1Enabled: globalFusionFlags.globalFusionV1,
    executiveLayerEnabled: globalFusionFlags.globalFusionExecutiveLayerV1,
    contributingSystemsCount: input.fusionPayload.meta.contributingSystemsCount,
    normalizedSignalCount: input.fusionPayload.meta.normalizedSignalCount,
    sourcesUsed: input.fusionPayload.meta.sourcesUsed,
  };

  return {
    overallStatus,
    companyReadiness: readiness,
    topPriorities: priorities,
    topRisks: risks,
    topOpportunities: opportunities,
    topBlockers: blockers,
    themes,
    rolloutSummary,
    healthSummary,
    notes,
    narrativeBlocks: buildNarrativeBlocks(
      readiness,
      priorities.map((p) => ({ title: p.title, theme: p.theme })),
      risks,
    ),
    provenance,
  };
}

export type BuildExecutiveSummaryOpts = {
  /** When provided, avoids a second primary surface build. */
  primary?: GlobalFusionPrimarySurfaceResult | null;
  days?: number;
  limit?: number;
};

/**
 * Async path: loads current Fusion primary + monitoring + governance + learning + freeze, then assembles executive summary.
 */
export async function buildGlobalFusionExecutiveSummary(opts: BuildExecutiveSummaryOpts = {}): Promise<GlobalFusionExecutiveSummary> {
  if (!globalFusionFlags.globalFusionExecutiveLayerV1) {
    return {
      overallStatus: "healthy",
      companyReadiness: {
        label: "strong",
        summary: "Executive operating layer is disabled (FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1 off).",
        factors: [],
      },
      topPriorities: [],
      topRisks: [],
      topOpportunities: [],
      topBlockers: [],
      themes: [],
      rolloutSummary: {
        pathLabel: "unknown",
        primaryActive: false,
        fallbackRate: 0,
        missingSourceRate: 0,
        conflictRate: 0,
        governanceDecision: null,
      },
      healthSummary: {
        overallStatus: "ok",
        observationalWarnings: [],
        insufficientEvidenceCount: 0,
        missingSourceCount: 0,
        fusedAgreementApprox: null,
      },
      notes: ["FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1_off"],
      narrativeBlocks: [],
      provenance: {
        generatedAt: new Date().toISOString(),
        fusionV1Enabled: globalFusionFlags.globalFusionV1,
        executiveLayerEnabled: false,
        contributingSystemsCount: 0,
        normalizedSignalCount: 0,
        sourcesUsed: [],
      },
      disabled: true,
      disabledReason: "FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1_off",
    };
  }

  try {
    const primary = opts.primary ?? (await buildGlobalFusionPrimarySurface({ days: opts.days ?? 7, limit: opts.limit ?? 10 }));
    const mon = getGlobalFusionMonitoringSnapshot();
    const input: GlobalFusionExecutiveAssemblyInput = {
      fusionPayload: primary.fusionPayload,
      primaryResult: primary,
      monitoring: monitoringSnapshotToExecutiveInput(mon),
      governanceSnapshot: globalFusionFlags.globalFusionGovernanceV1 ? getLastGovernanceSnapshot() : null,
      learningSummary: globalFusionFlags.globalFusionLearningV1 ? getLastLearningSummary() : null,
      learning:
        globalFusionFlags.globalFusionLearningV1
          ? (() => {
              const h = getGlobalFusionLearningHealthSnapshot();
              return {
                learningRuns: h.learningRuns,
                weightDriftL1: h.weightDriftL1,
                insufficientLinkageRate: h.insufficientLinkageRate,
              };
            })()
          : null,
      freezeState: getGlobalFusionFreezeState(),
    };

    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(input, primary);
    recordExecutiveSummaryGenerated(summary);
    maybePersistExecutiveSnapshot(summary);
    return summary;
  } catch {
    recordExecutiveSummaryFailure();
    return buildExecutiveErrorSummary("executive_assembly_error");
  }
}

function buildExecutiveErrorSummary(reason: string): GlobalFusionExecutiveSummary {
  const now = new Date().toISOString();
  return {
    overallStatus: "degraded",
    companyReadiness: {
      label: "at_risk",
      summary: "Executive summary could not be assembled from current Fusion inputs (observational).",
      factors: [reason],
    },
    topPriorities: [],
    topRisks: [],
    topOpportunities: [],
    topBlockers: [],
    themes: [],
    rolloutSummary: {
      pathLabel: "unknown",
      primaryActive: false,
      fallbackRate: 0,
      missingSourceRate: 0,
      conflictRate: 0,
      governanceDecision: null,
    },
    healthSummary: {
      overallStatus: "limited",
      observationalWarnings: [reason],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
      fusedAgreementApprox: null,
    },
    notes: [reason],
    narrativeBlocks: [],
    provenance: {
      generatedAt: now,
      fusionV1Enabled: globalFusionFlags.globalFusionV1,
      executiveLayerEnabled: globalFusionFlags.globalFusionExecutiveLayerV1,
      contributingSystemsCount: 0,
      normalizedSignalCount: 0,
      sourcesUsed: [],
    },
    disabled: true,
    disabledReason: reason,
  };
}
