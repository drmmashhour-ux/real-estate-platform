/**
 * Company Command Center V2 — composes tab views from existing V1 aggregate (no duplicate subsystem logic).
 */
import { logInfo } from "@/lib/logger";
import {
  adsAiAutomationFlags,
  autonomousGrowthFlags,
  croOptimizationV8Flags,
  fusionSystemFlags,
  oneBrainV8Flags,
  platformCoreFlags,
  rankingV8ShadowFlags,
  swarmSystemFlags,
} from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { mapHealthToRolloutPosture } from "./control-center-v2-status-mapper";
import {
  extractBrainOpportunities,
  extractBrainRisks,
  extractGrowthOpportunities,
  extractGrowthRisks,
  extractSwarmOpportunities,
  extractSwarmRisks,
} from "./company-command-center-v2-extraction";
import type {
  CompanyCommandCenterV2Payload,
  LoadCompanyCommandCenterV2Params,
  RolloutSystemRow,
} from "./company-command-center-v2.types";

const NS = "[control-center:v2]";

function buildRolloutRows(v1: CompanyCommandCenterV2Payload["v1"]): RolloutSystemRow[] {
  const s = v1.systems;
  const rows: RolloutSystemRow[] = [];

  rows.push({
    id: "brain",
    label: "Brain V8",
    posture: mapHealthToRolloutPosture(s.brain.status, {
      shadowFlag: oneBrainV8Flags.brainV8ShadowObservationV1,
      influenceFlag: oneBrainV8Flags.brainV8InfluenceV1,
      primaryFlag: oneBrainV8Flags.brainV8PrimaryV1,
    }),
    recommendation: s.brain.topRecommendation,
    warningCount: s.brain.warningCount,
    topNote: s.brain.topIssue ?? s.brain.summary.slice(0, 120),
  });

  rows.push({
    id: "ads",
    label: "Ads V8",
    posture: mapHealthToRolloutPosture(s.ads.status, {
      shadowFlag: adsAiAutomationFlags.adsAutopilotShadowModeV1,
      influenceFlag: adsAiAutomationFlags.adsAutopilotV8InfluenceV1,
      primaryFlag: adsAiAutomationFlags.adsAutopilotV8PrimaryV1,
    }),
    recommendation: s.ads.topRecommendation,
    warningCount: s.ads.anomalyNote ? 1 : 0,
    topNote: s.ads.anomalyNote ?? s.ads.summary.slice(0, 120),
  });

  rows.push({
    id: "cro",
    label: "CRO V8",
    posture: mapHealthToRolloutPosture(s.cro.status, {
      shadowFlag: croOptimizationV8Flags.croV8ShadowRecommendationsV1,
      influenceFlag: croOptimizationV8Flags.croV8ExperimentHooksV1,
      primaryFlag: false,
    }),
    recommendation: s.cro.readinessNote,
    warningCount: s.cro.warningSummary ? 1 : 0,
    topNote: s.cro.topBottleneck ?? s.cro.summary.slice(0, 120),
  });

  rows.push({
    id: "ranking",
    label: "Ranking V8",
    posture: mapHealthToRolloutPosture(s.ranking.status, {
      shadowFlag: rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1,
      influenceFlag: rankingV8ShadowFlags.rankingV8InfluenceV1,
      primaryFlag: false,
      blockedHint: v1.rolloutSummary.blockedSystems.some((x) => x.includes("Ranking")),
    }),
    recommendation: s.ranking.recommendation,
    warningCount: s.ranking.warningsCount ?? 0,
    topNote: s.ranking.summary.slice(0, 120),
  });

  rows.push({
    id: "fusion",
    label: "Fusion",
    posture: mapHealthToRolloutPosture(s.fusion.status, {
      shadowFlag: fusionSystemFlags.fusionSystemShadowV1,
      influenceFlag: fusionSystemFlags.fusionSystemInfluenceV1,
      primaryFlag: fusionSystemFlags.fusionSystemPrimaryV1,
    }),
    recommendation: s.fusion.topRecommendation,
    warningCount: s.fusion.healthNote ? 1 : 0,
    topNote: s.fusion.healthNote ?? s.fusion.summary.slice(0, 120),
  });

  rows.push({
    id: "swarm",
    label: "Swarm",
    posture: mapHealthToRolloutPosture(s.swarm.status, {
      shadowFlag: swarmSystemFlags.swarmSystemV1,
      influenceFlag: swarmSystemFlags.swarmAgentInfluenceV1,
      primaryFlag: swarmSystemFlags.swarmAgentPrimaryV1,
    }),
    recommendation: s.swarm.topOpportunity,
    warningCount: s.swarm.conflictCount ?? 0,
    topNote: s.swarm.negotiationNote ?? s.swarm.summary.slice(0, 120),
  });

  rows.push({
    id: "platform_core",
    label: "Platform Core V2",
    posture: mapHealthToRolloutPosture(s.platformCore.status, {
      shadowFlag: platformCoreFlags.platformCoreV1,
      influenceFlag: platformCoreFlags.platformCoreSimulationV1,
      primaryFlag: platformCoreFlags.platformCoreExecutionV1,
      blockedHint: (s.platformCore.blockedDecisions ?? 0) > 0,
    }),
    recommendation: s.platformCore.healthWarnings[0] ?? null,
    warningCount: s.platformCore.healthWarnings.length,
    topNote: s.platformCore.healthWarnings[0] ?? s.platformCore.summary.slice(0, 120),
  });

  rows.push({
    id: "growth_loop",
    label: "Global AI Growth Loop",
    posture: mapHealthToRolloutPosture(s.growthLoop.status, {
      shadowFlag: autonomousGrowthFlags.autonomousGrowthSimulationV1,
      influenceFlag: autonomousGrowthFlags.autonomousGrowthReevaluationV1,
      primaryFlag: autonomousGrowthFlags.autonomousGrowthExecutionV1,
    }),
    recommendation: s.growthLoop.notes,
    warningCount: 0,
    topNote: s.growthLoop.summary.slice(0, 120),
  });

  return rows;
}

export async function loadCompanyCommandCenterV2Payload(
  params: LoadCompanyCommandCenterV2Params = {},
): Promise<CompanyCommandCenterV2Payload> {
  const started = Date.now();
  const v1 = await loadAiControlCenterPayload({
    days: params.days,
    limit: params.limit,
    offsetDays: params.offsetDays,
  });

  const quickKpis: CompanyCommandCenterV2Payload["executive"]["quickKpis"] = [
      {
        label: "Ranking score",
        value:
          v1.systems.ranking.totalScore != null && v1.systems.ranking.maxScore != null
            ? `${v1.systems.ranking.totalScore.toFixed(1)}/${v1.systems.ranking.maxScore}`
            : "—",
        href: v1.systems.ranking.detailsHref,
      },
      {
        label: "Brain fallback %",
        value: v1.systems.brain.fallbackRatePct != null ? `${v1.systems.brain.fallbackRatePct.toFixed(1)}%` : "—",
        href: v1.systems.brain.detailsHref,
      },
      {
        label: "Ads risky %",
        value: v1.systems.ads.pctRunsRisky != null ? `${v1.systems.ads.pctRunsRisky.toFixed(0)}%` : "—",
        href: v1.systems.ads.detailsHref,
      },
      {
        label: "CRO bottleneck",
        value: v1.systems.cro.topBottleneck ?? "—",
        href: v1.systems.cro.detailsHref,
      },
      {
        label: "Platform overdue",
        value: v1.systems.platformCore.overdueSchedules != null ? String(v1.systems.platformCore.overdueSchedules) : "—",
        href: v1.systems.platformCore.detailsHref,
      },
      {
        label: "Fusion conflicts",
        value: v1.systems.fusion.conflictCount != null ? String(v1.systems.fusion.conflictCount) : "—",
        href: v1.systems.fusion.detailsHref,
      },
    {
      label: "Growth last",
      value: v1.systems.growthLoop.lastRunStatus ?? "—",
      href: v1.systems.growthLoop.detailsHref,
    },
  ];

  const partialData = v1.meta.missingSources.length > 0;

  const payload: CompanyCommandCenterV2Payload = {
    v1,
    executive: {
      overallStatus: v1.executiveSummary.overallStatus,
      criticalWarnings: v1.executiveSummary.criticalWarnings,
      topOpportunities: v1.executiveSummary.topOpportunities,
      topRisks: v1.executiveSummary.topRisks,
      systemsHealthyCount: v1.executiveSummary.systemsHealthyCount,
      systemsWarningCount: v1.executiveSummary.systemsWarningCount,
      systemsCriticalCount: v1.executiveSummary.systemsCriticalCount,
      rolloutSummary: v1.rolloutSummary,
      quickKpis,
      unifiedWarningsPreview: v1.unifiedWarnings.slice(0, 12),
    },
    growth: {
      opportunities: extractGrowthOpportunities(v1),
      risks: extractGrowthRisks(v1),
    },
    ranking: {
      governanceDashboardFlag: rankingV8ShadowFlags.rankingV8GovernanceDashboardV1,
    },
    brain: {
      opportunities: extractBrainOpportunities(v1),
      risks: extractBrainRisks(v1),
    },
    swarm: {
      opportunities: extractSwarmOpportunities(v1),
      risks: extractSwarmRisks(v1),
    },
    rollouts: {
      rows: buildRolloutRows(v1),
    },
    meta: {
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [...v1.meta.sourcesUsed, "control_center_v1:embedded"],
      missingSources: v1.meta.missingSources,
      systemsLoadedCount: v1.meta.systemsLoadedCount,
      overallStatus: v1.executiveSummary.overallStatus,
      partialData,
    },
  };

  logInfo(NS, {
    event: "payload_ready",
    systemsLoadedCount: payload.meta.systemsLoadedCount,
    missingSourcesCount: payload.meta.missingSources.length,
    overallStatus: payload.meta.overallStatus,
    partialData,
  });

  return payload;
}
