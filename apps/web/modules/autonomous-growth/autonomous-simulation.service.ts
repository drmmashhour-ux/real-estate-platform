import { platformCoreFlags } from "@/config/feature-flags";
import { buildExecutionPlanFromScored } from "@/modules/operator/operator-execution-planner.service";
import { scoreAssistantRecommendations } from "@/modules/operator/operator-recommendation-brain.service";
import { simulateExecutionPlan } from "@/modules/operator/operator-simulation.service";
import type { OperatorExecutionPlan, OperatorSimulationEstimate } from "@/modules/operator/operator-v2.types";
import { simulateDecisionImpact } from "@/modules/platform-core/platform-core-simulation.service";
import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import type { CoreDecisionRecord } from "@/modules/platform-core/platform-core.types";
import type { UnifiedAutonomousRow } from "./autonomous-decision-unifier.service";

export type AutonomousSimulationSummary = {
  operator: OperatorSimulationEstimate | null;
  platformCoreSample: Awaited<ReturnType<typeof simulateDecisionImpact>> | null;
  label: "estimate";
  aggregateNotes: string[];
  warnings: string[];
};

function runtimeEnv(): "development" | "staging" | "production" {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  return "development";
}

function mapCoreSource(s: AssistantRecommendation["source"]): CoreDecisionRecord["source"] {
  if (s === "PORTFOLIO") return "OPERATOR";
  return s as CoreDecisionRecord["source"];
}

function toCoreDecisionStub(row: UnifiedAutonomousRow): CoreDecisionRecord {
  const r = row.assistant;
  const now = new Date().toISOString();
  return {
    id: `autonomous-sim-${r.id}`,
    source: mapCoreSource(r.source),
    entityType: "UNKNOWN",
    entityId: r.targetId ?? null,
    title: r.title,
    summary: r.summary,
    reason: r.reason,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore ?? null,
    status: "PENDING",
    actionType: r.actionType,
    expectedImpact: r.expectedImpact ?? null,
    warnings: r.warnings ?? [],
    blockers: r.blockers ?? [],
    metadata: {
      trustScore: row.candidate.trustScore,
      profitImpact: row.candidate.metadata && (row.candidate.metadata as { metrics?: unknown }).metrics,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Heuristic simulation only — combines Operator plan simulation + optional Platform Core preview.
 */
export async function simulateAutonomousCandidates(
  rows: UnifiedAutonomousRow[],
): Promise<AutonomousSimulationSummary> {
  const aggregateNotes: string[] = [
    "Figures are labeled estimates — not calibrated forecasts. Use experiments and production metrics to validate.",
  ];
  const warnings: string[] = [];

  if (rows.length === 0) {
    return {
      operator: null,
      platformCoreSample: null,
      label: "estimate",
      aggregateNotes,
      warnings: ["No candidates to simulate."],
    };
  }

  const assistants = rows.map((x) => x.assistant);
  const scored = await scoreAssistantRecommendations(assistants);
  const plan: OperatorExecutionPlan = buildExecutionPlanFromScored({
    recommendations: assistants,
    scored,
    environment: runtimeEnv(),
    resolveConflicts: true,
  });

  const operator = simulateExecutionPlan(plan);

  let platformCoreSample: ReturnType<typeof simulateDecisionImpact> = null;
  if (platformCoreFlags.platformCoreSimulationV1) {
    const stub = toCoreDecisionStub(rows[0]!);
    platformCoreSample = simulateDecisionImpact(stub);
    if (!platformCoreSample) {
      warnings.push("Platform Core simulation returned null — check FEATURE_PLATFORM_CORE_SIMULATION_V1 and platformCoreV1.");
    }
  } else {
    warnings.push("Platform Core simulation disabled — enable FEATURE_PLATFORM_CORE_SIMULATION_V1 for cross-check previews.");
  }

  return {
    operator,
    platformCoreSample,
    label: "estimate",
    aggregateNotes,
    warnings,
  };
}
