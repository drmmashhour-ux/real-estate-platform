import {
  isOperatorGuardrailsEffective,
  operatorLayerFlags,
  operatorV2Flags,
  platformCoreFlags,
} from "@/config/feature-flags";
import { detectRecommendationConflicts } from "./conflict-resolution.service";
import { evaluateGuardrails } from "./guardrail-engine.service";
import * as loaders from "./recommendation-loaders.service";
import type { AssistantRecommendation, GuardrailEvaluation, RecommendationConflict } from "./operator.types";
import { isExternallySyncableBudgetAction } from "./operator-execution.types";
import * as repo from "./operator.repository";
import { withStableIds } from "./stable-recommendation-id";
import { buildExecutionPlan } from "./operator-execution-planner.service";
import { scoreAssistantRecommendations } from "./operator-recommendation-brain.service";
import { simulateExecutionPlan } from "./operator-simulation.service";
import type {
  OperatorExecutionPlan,
  OperatorScoredRecommendation,
  OperatorSimulationEstimate,
} from "./operator-v2.types";

function runtimeEnv(): "development" | "staging" | "production" {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  return "development";
}

export type AssistantFeedResponse = {
  topRecommendations: AssistantRecommendation[];
  blockedRecommendations: Array<{ recommendation: AssistantRecommendation; guardrail: GuardrailEvaluation }>;
  conflicts: RecommendationConflict[];
  monitoringOnly: AssistantRecommendation[];
  summaryCounts: {
    total: number;
    top: number;
    blocked: number;
    conflicts: number;
    monitoring: number;
  };
  subsystemWarnings: string[];
  persistWarnings: string[];
  operatorV2BudgetSyncEligibleCount?: number;
  operatorV2ExecutionPlan?: OperatorExecutionPlan;
  operatorV2Simulation?: OperatorSimulationEstimate;
  operatorV2ScoredPreview?: OperatorScoredRecommendation[];
};

function isMonitoring(r: AssistantRecommendation): boolean {
  return r.actionType === "MONITOR" || r.actionType === "NO_ACTION";
}

/**
 * Aggregates multi-source recommendations, resolves guardrails, persists audit rows, returns grouped UI payload.
 * Does not execute external changes.
 */
export async function buildAssistantRecommendationFeed(opts?: {
  persist?: boolean;
}): Promise<AssistantFeedResponse> {
  const subsystemWarnings: string[] = [];
  const persist = opts?.persist !== false;

  const results = await Promise.allSettled([
    loaders.getLatestAdsOperatorRecommendations(),
    loaders.getLatestProfitRecommendations(),
    loaders.getLatestCroRecommendations(),
    loaders.getLatestRetargetingRecommendations(),
    loaders.getLatestAbRecommendations(),
    loaders.getLatestMarketplaceRecommendations(),
    loaders.getLatestUnifiedMonitoringCard(),
    loaders.getLatestPortfolioRecommendations(),
  ]);

  const adsFromPlatformCore =
    platformCoreFlags.platformCoreV1 && platformCoreFlags.platformCoreAdsIngestionV1 ?
      await (async () => {
        try {
          const { listDecisions } = await import("@/modules/platform-core/platform-core.repository");
          const { mapPlatformCoreAdsDecisionsToAssistant } = await import(
            "@/modules/platform-core/platform-core-bridges/core-decision-to-assistant.mapper"
          );
          const rows = await listDecisions({ source: "ADS", limit: 60 });
          return mapPlatformCoreAdsDecisionsToAssistant(rows);
        } catch (e) {
          subsystemWarnings.push(`platform-core-ads: ${e instanceof Error ? e.message : "unavailable"}`);
          return null;
        }
      })()
    : null;

  const labels = ["ads", "profit", "cro", "retargeting", "ab", "marketplace", "unified", "portfolio"] as const;
  let combined: AssistantRecommendation[] = [];
  results.forEach((r, i) => {
    if (i === 0) {
      if (adsFromPlatformCore && adsFromPlatformCore.length > 0) {
        combined = combined.concat(adsFromPlatformCore);
        return;
      }
    }
    if (r.status === "fulfilled") combined = combined.concat(r.value);
    else subsystemWarnings.push(`${labels[i]}: ${r.reason instanceof Error ? r.reason.message : "unavailable"}`);
  });

  combined = withStableIds(combined);

  const conflicts =
    operatorLayerFlags.operatorConflictsV1 || operatorLayerFlags.aiAssistantLayerV1 ?
      detectRecommendationConflicts(combined)
    : [];

  const guardrailsOn = isOperatorGuardrailsEffective();
  const env = runtimeEnv();

  const blockedRecommendations: AssistantFeedResponse["blockedRecommendations"] = [];
  const passThrough: AssistantRecommendation[] = [];

  for (const rec of combined) {
    if (!guardrailsOn) {
      passThrough.push(rec);
      continue;
    }
    const g = evaluateGuardrails({ recommendation: rec, environment: env });
    if (!g.allowed) blockedRecommendations.push({ recommendation: rec, guardrail: g });
    else passThrough.push(rec);
  }

  const monitoringOnly = passThrough.filter(isMonitoring);
  const actionable = passThrough.filter((r) => !isMonitoring(r));

  actionable.sort((a, b) => b.confidenceScore - a.confidenceScore);
  const topRecommendations = actionable.slice(0, 16);

  const persistWarnings: string[] = [];
  if (persist && operatorLayerFlags.aiAssistantLayerV1) {
    const saveRec = await repo.saveRecommendations(combined);
    persistWarnings.push(...saveRec.warnings);
    if (conflicts.length > 0) {
      try {
        await repo.saveConflictSnapshots(conflicts);
      } catch (e) {
        persistWarnings.push(`Conflict snapshot save failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  if (persist && platformCoreFlags.platformCoreV1) {
    try {
      const { ingestFromAssistantRecommendations } = await import("@/modules/platform-core/platform-core.service");
      await ingestFromAssistantRecommendations(combined.slice(0, 35));
    } catch (e) {
      persistWarnings.push(`Platform core ingest: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const operatorV2BudgetSyncEligibleCount =
    operatorV2Flags.operatorV2BudgetSyncV1 ?
      combined.filter((r) => isExternallySyncableBudgetAction(r.actionType)).length
    : undefined;

  const actionableForPlan = passThrough.filter((r) => !isMonitoring(r));
  let operatorV2ExecutionPlan: OperatorExecutionPlan | undefined;
  let operatorV2Simulation: OperatorSimulationEstimate | undefined;
  let operatorV2ScoredPreview: OperatorScoredRecommendation[] | undefined;

  if (operatorV2Flags.operatorV2ExecutionPlanV1 && actionableForPlan.length > 0) {
    operatorV2ExecutionPlan = await buildExecutionPlan({
      recommendations: actionableForPlan,
      environment: env,
      resolveConflicts: operatorV2Flags.operatorV2ConflictEngineV1,
    });
    operatorV2ScoredPreview = operatorV2ExecutionPlan.rankedFull ?? operatorV2ExecutionPlan.ordered;
    if (operatorV2Flags.operatorV2SimulationV1 && operatorV2ExecutionPlan) {
      operatorV2Simulation = simulateExecutionPlan(operatorV2ExecutionPlan);
    }
  }

  return {
    topRecommendations,
    blockedRecommendations,
    conflicts,
    monitoringOnly,
    summaryCounts: {
      total: combined.length,
      top: topRecommendations.length,
      blocked: blockedRecommendations.length,
      conflicts: conflicts.length,
      monitoring: monitoringOnly.length,
    },
    subsystemWarnings,
    persistWarnings,
    operatorV2BudgetSyncEligibleCount,
    operatorV2ExecutionPlan,
    operatorV2Simulation,
    operatorV2ScoredPreview,
  };
}
