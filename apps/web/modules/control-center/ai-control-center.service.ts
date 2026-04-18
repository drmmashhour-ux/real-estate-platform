/**
 * Read-only executive control center — aggregates subsystem signals; no writes, no flag toggles.
 */
import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import {
  adsAiAutomationFlags,
  autonomousGrowthFlags,
  croOptimizationV8Flags,
  fusionSystemFlags,
  isFusionOrchestrationActive,
  oneBrainV8Flags,
  operatorV2Flags,
  platformCoreFlags,
  rankingV8ShadowFlags,
  swarmSystemFlags,
} from "@/config/feature-flags";
import { getLastBrainV8ComparisonReport } from "@/modules/platform-core/brain-v8-shadow-comparison.service";
import { getBrainV8ShadowMonitoringSnapshot } from "@/modules/platform-core/brain-v8-shadow-monitoring.service";
import { getBrainV8PrimaryMonitoringSnapshot } from "@/modules/platform-core/brain-v8-primary-monitoring.service";
import { getAdsV8ComparisonAggregationSnapshot } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.comparison";
import { loadRankingV8GovernancePayload } from "@/modules/ranking/ranking-v8-governance.service";
import { getPlatformCoreHealth } from "@/modules/platform-core/platform-health.service";
import { listRecentAutonomousRuns } from "@/modules/autonomous-growth/autonomous-growth.repository";
import { buildFusionSnapshotV1 } from "@/modules/fusion/fusion-system.service";
import { mapUnifiedStatus, rankingRecommendationIsBlocked } from "./control-center-status-mapper";
import {
  countSystemBuckets,
  extractTopOpportunities,
  extractTopRisks,
  mergeCriticalWarnings,
} from "./control-center-opportunities";
import type {
  AiControlCenterPayload,
  AiControlCenterSystems,
  LoadAiControlCenterParams,
} from "./ai-control-center.types";

const NS = "[control-center]";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "timeout"> {
  return Promise.race([
    p.then((x) => x as T),
    new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms)),
  ]);
}

async function safeAsync<T>(label: string, ms: number, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    const r = await withTimeout(fn(), ms);
    if (r === "timeout") return { ok: false };
    return { ok: true, value: r };
  } catch {
    return { ok: false };
  }
}

export async function loadAiControlCenterPayload(params: LoadAiControlCenterParams = {}): Promise<AiControlCenterPayload> {
  try {
    return await assembleAiControlCenterPayload(params);
  } catch (e) {
    logInfo(NS, {
      event: "aggregation_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    return buildFatalFallbackPayload(params, e);
  }
}

async function assembleAiControlCenterPayload(params: LoadAiControlCenterParams = {}): Promise<AiControlCenterPayload> {
  const started = Date.now();
  const days = Math.min(90, Math.max(1, params.days ?? 7));
  const limit = Math.min(50, Math.max(1, params.limit ?? 10));
  const offsetDays = Math.max(0, params.offsetDays ?? 0);

  const sourcesUsed: string[] = [];
  const missingSources: string[] = [];
  let loaded = 0;

  const brainReport = getLastBrainV8ComparisonReport();
  const brainShadowMon = getBrainV8ShadowMonitoringSnapshot();
  const brainPrimaryMon = getBrainV8PrimaryMonitoringSnapshot();
  sourcesUsed.push("brain_v8:in_memory");

  const adsAgg = getAdsV8ComparisonAggregationSnapshot();
  sourcesUsed.push("ads_v8:comparison_aggregation");

  const brainV8Any =
    oneBrainV8Flags.brainV8ShadowObservationV1 ||
    oneBrainV8Flags.brainV8InfluenceV1 ||
    oneBrainV8Flags.brainV8PrimaryV1;

  const brainWarnings =
    (brainReport?.interpretation.warnings.length ?? 0) + (brainPrimaryMon.postCutover?.observationalWarnings.length ?? 0);
  /** Post-cutover supplement uses 0–100 for display rate. */
  const fbPct = brainPrimaryMon.postCutover?.fallbackRatePct ?? null;

  const brainStatus = mapUnifiedStatus({
    disabled: !brainV8Any,
    unavailable: false,
    hasCriticalSignal: fbPct != null && fbPct > 45,
    hasWarning: brainWarnings >= 3 || (brainReport?.metrics.divergenceRate ?? 0) > 0.5,
    hasLimitedCoverage: !brainV8Any || (brainReport == null && brainShadowMon.passesRun === 0),
  });

  const brain: AiControlCenterSystems["brain"] = {
    status: brainStatus,
    summary: brainV8Any
      ? `Shadow passes ${brainShadowMon.passesRun} · comparison runs ${brainReport?.aggregation.comparisonRuns ?? 0}`
      : "Brain V8 layers disabled via flags.",
    shadowObservationEnabled: oneBrainV8Flags.brainV8ShadowObservationV1,
    influenceEnabled: oneBrainV8Flags.brainV8InfluenceV1,
    primaryEnabled: oneBrainV8Flags.brainV8PrimaryV1,
    fallbackRatePct: fbPct,
    warningCount: brainWarnings,
    comparisonRuns: brainReport?.aggregation.comparisonRuns ?? null,
    avgOverlapRate: brainReport?.metrics.overlapRate ?? null,
    lastReportAt: brainReport?.observedAt ?? null,
    topIssue:
      brainReport?.interpretation.warnings[0]?.message ??
      brainPrimaryMon.recentPrimaryFallbackReasons[0] ??
      null,
    topRecommendation: brainReport?.interpretation.heuristicSummaries[0] ?? null,
    detailsHref: "/admin/lecipm-engines",
  };
  if (brainV8Any) loaded += 1;

  const adsStatus = mapUnifiedStatus({
    disabled: !adsAiAutomationFlags.adsAutopilotV8RolloutV1 && !adsAiAutomationFlags.adsAutopilotShadowModeV1,
    unavailable: false,
    hasCriticalSignal: adsAgg.pctRunsRisky != null && adsAgg.pctRunsRisky > 50,
    hasWarning: adsAgg.pctRunsRisky != null && adsAgg.pctRunsRisky > 25,
    hasLimitedCoverage: adsAgg.runs === 0,
  });

  const ads: AiControlCenterSystems["ads"] = {
    status: adsStatus,
    summary:
      adsAgg.runs > 0
        ? `V8 comparison runs ${adsAgg.runs} · avg overlap ${adsAgg.avgOverlapRate != null ? (adsAgg.avgOverlapRate * 100).toFixed(0) + "%" : "—"}`
        : "No in-process Ads V8 comparison aggregate yet (cold instance or shadow off).",
    shadowMode: adsAiAutomationFlags.adsAutopilotShadowModeV1,
    v8Rollout: adsAiAutomationFlags.adsAutopilotV8RolloutV1,
    influenceEnabled: adsAiAutomationFlags.adsAutopilotV8InfluenceV1,
    primaryEnabled: adsAiAutomationFlags.adsAutopilotV8PrimaryV1,
    comparisonRuns: adsAgg.runs,
    avgOverlapRate: adsAgg.avgOverlapRate,
    avgDivergenceRate: adsAgg.avgDivergenceRate,
    pctRunsRisky: adsAgg.pctRunsRisky,
    anomalyNote: adsAgg.pctRunsRisky != null && adsAgg.pctRunsRisky > 25 ? "Elevated risky-run rate in aggregate" : null,
    topRecommendation:
      adsAiAutomationFlags.adsAutopilotV8PrimaryV1 ? "Primary routing enabled — verify comparison quality in logs" : null,
    detailsHref: "/admin/growth-autopilot-v2",
  };
  loaded += 1;

  const croBundle = await safeAsync("cro", 4000, async () => {
    const { runCroV8OptimizationBundle } = await import("@/services/growth/cro-v8-optimization-bridge");
    return runCroV8OptimizationBundle({ rangeDays: Math.min(days, 30), offsetDays });
  });
  let cro: AiControlCenterSystems["cro"];
  if (croBundle.ok && croBundle.value) {
    sourcesUsed.push("cro_v8:bundle");
    loaded += 1;
    const b = croBundle.value;
    const topDrop = b.dropoffs[0];
    const croSt = mapUnifiedStatus({
      disabled: !croOptimizationV8Flags.croV8AnalysisV1,
      unavailable: false,
      hasCriticalSignal: (b.healthScore ?? 100) < 30,
      hasWarning: (b.healthScore ?? 100) < 55,
      hasLimitedCoverage: b.shadowRecommendations.length === 0,
    });
    cro = {
      status: croSt,
      summary: `Health ${b.healthScore ?? "—"} · ${b.dropoffs.length} drop-off signal(s)`,
      analysisEnabled: croOptimizationV8Flags.croV8AnalysisV1,
      healthScore: b.healthScore,
      topBottleneck: topDrop ? `${topDrop.stage}: ${topDrop.label}` : null,
      dropoffSummary: b.dropoffs.length ? `${b.dropoffs.length} stages flagged` : null,
      recommendationCount: b.shadowRecommendations.length,
      readinessNote: b.experimentReadiness ? "Experiment hooks active" : null,
      warningSummary: b.healthScore != null && b.healthScore < 50 ? "Below comfort health threshold" : null,
      detailsHref: "/admin/funnel",
    };
  } else {
    if (!croOptimizationV8Flags.croV8AnalysisV1) missingSources.push("cro_v8:disabled_flag");
    else missingSources.push("cro_v8:bundle_unavailable");
    cro = {
      status: "unavailable",
      summary: croOptimizationV8Flags.croV8AnalysisV1 ? "CRO V8 bundle not returned (timeout or error)." : "CRO V8 analysis disabled.",
      analysisEnabled: croOptimizationV8Flags.croV8AnalysisV1,
      healthScore: null,
      topBottleneck: null,
      dropoffSummary: null,
      recommendationCount: null,
      readinessNote: null,
      warningSummary: null,
      detailsHref: "/admin/funnel",
    };
  }

  const rankGov = await safeAsync("ranking", 4500, () =>
    loadRankingV8GovernancePayload({ days, limit, offsetDays }),
  );
  let ranking: AiControlCenterSystems["ranking"];
  if (rankGov.ok) {
    sourcesUsed.push("ranking_v8:governance");
    loaded += 1;
    const g = rankGov.value;
    const r = g.rollout.readiness;
    const gatesOk = [r.qualityReady, r.stabilityReady, r.safetyReady, r.coverageReady, r.userImpactReady && !r.userImpactNa].filter(
      Boolean,
    ).length;
    const rankSt = mapUnifiedStatus({
      disabled: !rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1,
      unavailable: g.meta.missingSources.includes("ranking_shadow_observations:empty_range"),
      hasCriticalSignal: g.rollout.recommendation === "rollback_recommended" || g.rollbackSignals.severeOverlapDrop,
      hasWarning: g.rollout.blockingReasons.length > 0 || g.rollout.warnings.length > 3,
      hasLimitedCoverage: g.meta.missingSources.length > 0,
    });
    ranking = {
      status: rankSt,
      summary: `Score ${g.scorecard.totalScore.toFixed(1)}/${g.scorecard.maxScore} · ${g.rollout.recommendation}`,
      totalScore: g.scorecard.totalScore,
      maxScore: g.scorecard.maxScore,
      recommendation: g.rollout.recommendation,
      readinessGatesOk: gatesOk,
      readinessGatesTotal: 5,
      rollbackAny: Object.values(g.rollbackSignals).some(Boolean),
      top5Overlap: g.metrics.top5Overlap,
      avgRankShift: g.metrics.avgRankShift,
      warningsCount: g.rollout.warnings.length,
      detailsHref: "/admin/analytics",
    };
  } else {
    missingSources.push("ranking_v8:governance");
    ranking = {
      status: "unavailable",
      summary: "Ranking governance payload unavailable.",
      totalScore: null,
      maxScore: null,
      recommendation: null,
      readinessGatesOk: null,
      readinessGatesTotal: null,
      rollbackAny: false,
      top5Overlap: null,
      avgRankShift: null,
      warningsCount: null,
      detailsHref: "/admin/analytics",
    };
  }

  const op: AiControlCenterSystems["operator"] = {
    status: mapUnifiedStatus({
      disabled: !operatorV2Flags.operatorV2BudgetSyncV1,
      unavailable: false,
      hasCriticalSignal: false,
      hasWarning: operatorV2Flags.operatorExternalSyncV1 && !operatorV2Flags.operatorV2ConflictEngineV1,
      hasLimitedCoverage: false,
    }),
    summary: `Execution plan ${operatorV2Flags.operatorV2ExecutionPlanV1 ? "on" : "off"} · simulation ${
      operatorV2Flags.operatorV2SimulationV1 ? "on" : "off"
    }`,
    executionPlanFlag: operatorV2Flags.operatorV2ExecutionPlanV1,
    simulationFlag: operatorV2Flags.operatorV2SimulationV1,
    conflictEngineFlag: operatorV2Flags.operatorV2ConflictEngineV1,
    priorityScoringFlag: operatorV2Flags.operatorV2PriorityV1,
    planCount: null,
    conflictCount: null,
    topRecommendation: operatorV2Flags.operatorV2ExecutionPlanV1
      ? "Review assistant execution plan previews before any external sync"
      : null,
    detailsHref: "/admin/execution",
  };
  loaded += 1;

  const plat = await safeAsync("platform_core", 5000, () => getPlatformCoreHealth());
  let platformCore: AiControlCenterSystems["platformCore"];
  if (plat.ok) {
    sourcesUsed.push("platform_core:health");
    loaded += 1;
    const h = plat.value;
    const pcStatus = mapUnifiedStatus({
      disabled: !platformCoreFlags.platformCoreV1,
      unavailable: false,
      hasCriticalSignal: h.blockedDecisions > 80 || h.failedTasks > 20,
      hasWarning: h.warnings.length > 0,
      hasLimitedCoverage: !platformCoreFlags.platformCoreSchedulerV1,
    });
    platformCore = {
      status: pcStatus,
      summary: `Pending ${h.pendingDecisions} · blocked ${h.blockedDecisions} · audit(1h) ${h.recentAuditCount}`,
      priorityEnabled: platformCoreFlags.platformCorePriorityV1,
      dependenciesEnabled: platformCoreFlags.platformCoreDependenciesV1,
      schedulerEnabled: platformCoreFlags.platformCoreSchedulerV1,
      simulationEnabled: platformCoreFlags.platformCoreSimulationV1,
      pendingDecisions: h.pendingDecisions,
      blockedDecisions: h.blockedDecisions,
      overdueSchedules: null,
      blockedDependencyEdges: null,
      healthWarnings: h.warnings,
      detailsHref: "/admin/command-center",
    };
    const overdue = await safeAsync("overdue", 3000, async () => {
      if (!platformCoreFlags.platformCoreSchedulerV1) return 0;
      return prisma.platformCoreDecisionSchedule.count({ where: { nextRunAt: { lt: new Date() } } });
    });
    if (overdue.ok) platformCore.overdueSchedules = overdue.value;
    if (platformCoreFlags.platformCoreDependenciesV1) {
      const blockedE = await safeAsync("blocked_edges", 2500, () =>
        prisma.platformCoreDecisionDependency.count({ where: { type: "BLOCKS" } }),
      );
      if (blockedE.ok) platformCore.blockedDependencyEdges = blockedE.value;
    }
  } else {
    missingSources.push("platform_core:health");
    platformCore = {
      status: "unavailable",
      summary: "Platform Core health query failed or timed out.",
      priorityEnabled: platformCoreFlags.platformCorePriorityV1,
      dependenciesEnabled: platformCoreFlags.platformCoreDependenciesV1,
      schedulerEnabled: platformCoreFlags.platformCoreSchedulerV1,
      simulationEnabled: platformCoreFlags.platformCoreSimulationV1,
      pendingDecisions: null,
      blockedDecisions: null,
      overdueSchedules: null,
      blockedDependencyEdges: null,
      healthWarnings: [],
      detailsHref: "/admin/command-center",
    };
  }

  const fusionSnap = await safeAsync("fusion", 4000, () => buildFusionSnapshotV1());
  let fusion: AiControlCenterSystems["fusion"];
  if (fusionSnap.ok && fusionSnap.value) {
    sourcesUsed.push("fusion:snapshot");
    loaded += 1;
    const sn = fusionSnap.value;
    fusion = {
      status: mapUnifiedStatus({
        disabled: !isFusionOrchestrationActive(),
        unavailable: false,
        hasCriticalSignal: sn.conflicts.filter((c) => c.severity === "high").length > 6,
        hasWarning: sn.health.observationalWarnings.length > 0 || sn.conflicts.length > 4,
        hasLimitedCoverage: sn.signals.length < 2,
      }),
      summary: `${sn.signals.length} signals · ${sn.conflicts.length} conflicts · ${sn.recommendations.length} advisory recs`,
      orchestrationActive: isFusionOrchestrationActive(),
      influenceEnabled: fusionSystemFlags.fusionSystemInfluenceV1,
      primaryEnabled: fusionSystemFlags.fusionSystemPrimaryV1,
      agreementHint: sn.comparisonSummary.notes[0] ?? null,
      conflictCount: sn.conflicts.length,
      recommendationCount: sn.recommendations.length,
      healthNote: sn.health.observationalWarnings[0] ?? null,
      topRecommendation: sn.recommendations[0]?.title ?? null,
      detailsHref: "/admin/lecipm-ai-autopilot",
    };
  } else {
    if (!isFusionOrchestrationActive()) missingSources.push("fusion:inactive");
    else missingSources.push("fusion:snapshot_unavailable");
    fusion = {
      status: "unavailable",
      summary: isFusionOrchestrationActive() ? "Fusion snapshot unavailable (timeout/error)." : "Fusion orchestration inactive.",
      orchestrationActive: isFusionOrchestrationActive(),
      influenceEnabled: fusionSystemFlags.fusionSystemInfluenceV1,
      primaryEnabled: fusionSystemFlags.fusionSystemPrimaryV1,
      agreementHint: null,
      conflictCount: null,
      recommendationCount: null,
      healthNote: null,
      topRecommendation: null,
      detailsHref: "/admin/lecipm-ai-autopilot",
    };
  }

  const runs = await safeAsync("growth_runs", 3000, () => listRecentAutonomousRuns(5));
  let growthLoop: AiControlCenterSystems["growthLoop"];
  if (runs.ok) {
    sourcesUsed.push("autonomous_growth:runs");
    loaded += 1;
    const last = runs.value[0];
    growthLoop = {
      status: mapUnifiedStatus({
        disabled: !autonomousGrowthFlags.autonomousGrowthSystemV1,
        unavailable: runs.value.length === 0,
        hasCriticalSignal: last?.status === "failed",
        hasWarning: (last?.blockedCount ?? 0) > 3,
        hasLimitedCoverage: runs.value.length === 0,
      }),
      summary: last
        ? `Last run ${last.status} · ${last.recommendationCount} recs`
        : "No autonomous growth runs recorded.",
      systemEnabled: autonomousGrowthFlags.autonomousGrowthSystemV1,
      executionEnabled: autonomousGrowthFlags.autonomousGrowthExecutionV1,
      simulationEnabled: autonomousGrowthFlags.autonomousGrowthSimulationV1,
      lastRunStatus: last?.status ?? null,
      lastRunAt: last?.createdAt.toISOString() ?? null,
      actionsProposed: last?.recommendationCount ?? null,
      actionsExecuted: last?.executableCount ?? null,
      notes: null,
      detailsHref: "/admin/autonomous-system",
    };
  } else {
    missingSources.push("autonomous_growth:runs");
    growthLoop = {
      status: "unavailable",
      summary: "Could not load autonomous growth runs.",
      systemEnabled: autonomousGrowthFlags.autonomousGrowthSystemV1,
      executionEnabled: autonomousGrowthFlags.autonomousGrowthExecutionV1,
      simulationEnabled: autonomousGrowthFlags.autonomousGrowthSimulationV1,
      lastRunStatus: null,
      lastRunAt: null,
      actionsProposed: null,
      actionsExecuted: null,
      notes: null,
      detailsHref: "/admin/autonomous-system",
    };
  }

  const swarm: AiControlCenterSystems["swarm"] = {
    status: mapUnifiedStatus({
      disabled: !swarmSystemFlags.swarmSystemV1,
      unavailable: false,
      hasCriticalSignal: false,
      hasWarning: false,
      hasLimitedCoverage: true,
    }),
    summary: swarmSystemFlags.swarmSystemV1
      ? "Swarm orchestration enabled — full cycle not executed in this read (use dedicated swarm tools)."
      : "Swarm system disabled.",
    enabled: swarmSystemFlags.swarmSystemV1,
    negotiationEnabled: swarmSystemFlags.swarmAgentNegotiationV1,
    influenceEnabled: swarmSystemFlags.swarmAgentInfluenceV1,
    primaryEnabled: swarmSystemFlags.swarmAgentPrimaryV1,
    agentSlots: 8,
    conflictCount: null,
    humanReviewCount: null,
    topOpportunity: null,
    negotiationNote: swarmSystemFlags.swarmAgentNegotiationV1 ? "Negotiation layer on — advisory outcomes in swarm bundle when run" : null,
    detailsHref: "/admin/autonomy",
  };
  loaded += 1;

  const systems: AiControlCenterSystems = {
    brain,
    ads,
    cro,
    ranking,
    operator: op,
    platformCore,
    fusion,
    growthLoop,
    swarm,
  };

  const unifiedWarnings: string[] = [];
  const pushW = (s: string) => {
    if (s && !unifiedWarnings.includes(s)) unifiedWarnings.push(s);
  };
  for (const w of platformCore.healthWarnings.slice(0, 5)) pushW(w);
  if (rankGov.ok && rankGov.value.rollout.warnings.length) {
    for (const w of rankGov.value.rollout.warnings.slice(0, 5)) pushW(w);
  }
  if (brainReport?.interpretation.warnings.length) {
    for (const w of brainReport.interpretation.warnings.slice(0, 3)) pushW(w.message);
  }
  if (adsAgg.pctRunsRisky != null && adsAgg.pctRunsRisky > 30) {
    pushW(`Ads V8: risky run rate ${adsAgg.pctRunsRisky.toFixed(0)}%`);
  }
  if (rankGov.ok && rankingRecommendationIsBlocked(rankGov.value.rollout.recommendation)) {
    pushW(`Ranking governance: ${rankGov.value.rollout.recommendation}`);
  }

  const rolloutSummary = {
    primarySystems: [
      ...(oneBrainV8Flags.brainV8PrimaryV1 ? ["Brain V8"] : []),
      ...(adsAiAutomationFlags.adsAutopilotV8PrimaryV1 ? ["Ads V8"] : []),
      ...(fusionSystemFlags.fusionSystemPrimaryV1 ? ["Fusion"] : []),
      ...(swarmSystemFlags.swarmAgentPrimaryV1 ? ["Swarm"] : []),
    ],
    shadowSystems: [
      ...(oneBrainV8Flags.brainV8ShadowObservationV1 ? ["Brain V8"] : []),
      ...(adsAiAutomationFlags.adsAutopilotShadowModeV1 ? ["Ads V8"] : []),
      ...(rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1 ? ["Ranking V8"] : []),
      ...(fusionSystemFlags.fusionSystemShadowV1 ? ["Fusion"] : []),
    ],
    influenceSystems: [
      ...(oneBrainV8Flags.brainV8InfluenceV1 ? ["Brain V8"] : []),
      ...(adsAiAutomationFlags.adsAutopilotV8InfluenceV1 ? ["Ads V8"] : []),
      ...(rankingV8ShadowFlags.rankingV8InfluenceV1 ? ["Ranking V8"] : []),
      ...(fusionSystemFlags.fusionSystemInfluenceV1 ? ["Fusion"] : []),
      ...(swarmSystemFlags.swarmAgentInfluenceV1 ? ["Swarm"] : []),
    ],
    blockedSystems: [
      ...(rankGov.ok && rankGov.value.rollout.blockingReasons.length ? ["Ranking V8 (gates)"] : []),
      ...(plat.ok && plat.value.blockedDecisions > 0 ? [`Platform Core (${plat.value.blockedDecisions} blocked)`] : []),
    ],
  };

  const draftPayload: AiControlCenterPayload = {
    systems,
    executiveSummary: {
      overallStatus: "healthy",
      criticalWarnings: [],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 0,
      systemsWarningCount: 0,
      systemsCriticalCount: 0,
    },
    rolloutSummary,
    unifiedWarnings,
    history: [],
    meta: {
      dataFreshnessMs: Date.now() - started,
      sourcesUsed,
      missingSources,
      systemsLoadedCount: loaded,
    },
  };

  draftPayload.history = (runs.ok ? runs.value : []).map((r) => ({
    ts: r.createdAt.toISOString(),
    system: "Global AI Growth Loop",
    event: r.status,
    note: `recs ${r.recommendationCount} · blocked ${r.blockedCount}`,
  }));

  const buckets = countSystemBuckets(systems);
  draftPayload.executiveSummary.systemsHealthyCount = buckets.healthy;
  draftPayload.executiveSummary.systemsWarningCount = buckets.warning;
  draftPayload.executiveSummary.systemsCriticalCount = buckets.critical;
  draftPayload.executiveSummary.topOpportunities = extractTopOpportunities(draftPayload);
  draftPayload.executiveSummary.topRisks = extractTopRisks(draftPayload);
  draftPayload.executiveSummary.criticalWarnings = mergeCriticalWarnings(draftPayload);

  const overall: AiControlCenterPayload["executiveSummary"]["overallStatus"] =
    buckets.critical >= 2 ||
    (rankGov.ok && rankGov.value.rollout.recommendation === "rollback_recommended") ||
    (rankGov.ok && rankGov.value.rollbackSignals.severeOverlapDrop)
      ? "critical"
      : buckets.critical >= 1 || draftPayload.executiveSummary.criticalWarnings.length >= 5
        ? "warning"
        : buckets.warning >= 4
          ? "warning"
          : buckets.warning >= 1
            ? "limited"
            : "healthy";

  draftPayload.executiveSummary.overallStatus = overall;

  logInfo(NS, {
    event: "payload_ready",
    systemsLoadedCount: loaded,
    missingSourcesCount: missingSources.length,
    overallStatus: overall,
  });

  return draftPayload;
}

function buildFatalFallbackPayload(_params: LoadAiControlCenterParams, err: unknown): AiControlCenterPayload {
  const u = (summary: string) =>
    ({
      status: "unavailable" as const,
      summary,
      detailsHref: null,
    }) as const;

  const started = Date.now();
  const systems: AiControlCenterSystems = {
    brain: {
      ...u("Brain V8 — unavailable"),
      shadowObservationEnabled: false,
      influenceEnabled: false,
      primaryEnabled: false,
      fallbackRatePct: null,
      warningCount: 0,
      comparisonRuns: null,
      avgOverlapRate: null,
      lastReportAt: null,
      topIssue: null,
      topRecommendation: null,
      detailsHref: "/admin/lecipm-engines",
    },
    ads: {
      ...u("Ads V8 — unavailable"),
      shadowMode: false,
      v8Rollout: false,
      influenceEnabled: false,
      primaryEnabled: false,
      comparisonRuns: null,
      avgOverlapRate: null,
      avgDivergenceRate: null,
      pctRunsRisky: null,
      anomalyNote: null,
      topRecommendation: null,
      detailsHref: "/admin/growth-autopilot-v2",
    },
    cro: {
      ...u("CRO V8 — unavailable"),
      analysisEnabled: false,
      healthScore: null,
      topBottleneck: null,
      dropoffSummary: null,
      recommendationCount: null,
      readinessNote: null,
      warningSummary: null,
      detailsHref: "/admin/funnel",
    },
    ranking: {
      ...u("Ranking V8 — unavailable"),
      totalScore: null,
      maxScore: null,
      recommendation: null,
      readinessGatesOk: null,
      readinessGatesTotal: null,
      rollbackAny: false,
      top5Overlap: null,
      avgRankShift: null,
      warningsCount: null,
      detailsHref: "/admin/analytics",
    },
    operator: {
      ...u("Operator V2 — unavailable"),
      executionPlanFlag: false,
      simulationFlag: false,
      conflictEngineFlag: false,
      priorityScoringFlag: false,
      planCount: null,
      conflictCount: null,
      topRecommendation: null,
      detailsHref: "/admin/execution",
    },
    platformCore: {
      ...u("Platform Core — unavailable"),
      priorityEnabled: false,
      dependenciesEnabled: false,
      schedulerEnabled: false,
      simulationEnabled: false,
      pendingDecisions: null,
      blockedDecisions: null,
      overdueSchedules: null,
      blockedDependencyEdges: null,
      healthWarnings: [],
      detailsHref: "/admin/command-center",
    },
    fusion: {
      ...u("Fusion — unavailable"),
      orchestrationActive: false,
      influenceEnabled: false,
      primaryEnabled: false,
      agreementHint: null,
      conflictCount: null,
      recommendationCount: null,
      healthNote: null,
      topRecommendation: null,
      detailsHref: "/admin/lecipm-ai-autopilot",
    },
    growthLoop: {
      ...u("Growth loop — unavailable"),
      systemEnabled: false,
      executionEnabled: false,
      simulationEnabled: false,
      lastRunStatus: null,
      lastRunAt: null,
      actionsProposed: null,
      actionsExecuted: null,
      notes: null,
      detailsHref: "/admin/autonomous-system",
    },
    swarm: {
      ...u("Swarm — unavailable"),
      enabled: false,
      negotiationEnabled: false,
      influenceEnabled: false,
      primaryEnabled: false,
      agentSlots: 0,
      conflictCount: null,
      humanReviewCount: null,
      topOpportunity: null,
      negotiationNote: null,
      detailsHref: "/admin/autonomy",
    },
  };

  const msg = err instanceof Error ? err.message : String(err);
  return {
    systems,
    executiveSummary: {
      overallStatus: "warning",
      criticalWarnings: [`Control center aggregation failed: ${msg}`],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 0,
      systemsWarningCount: 9,
      systemsCriticalCount: 0,
    },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    unifiedWarnings: [`control_center:fatal: ${msg}`],
    history: [],
    meta: {
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [],
      missingSources: ["control_center:fatal"],
      systemsLoadedCount: 0,
    },
  };
}
