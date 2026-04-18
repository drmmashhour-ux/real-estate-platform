import type { PlatformAutopilotRiskClass } from "@prisma/client";
import { operatorV2Flags } from "@/config/feature-flags";
import type { ProposedAction } from "@/modules/ai-autopilot/ai-autopilot.types";
import { buildExecutionPlan } from "@/modules/operator/operator-execution-planner.service";
import { isExternallySyncableBudgetAction } from "./operator-execution.types";
import type { AssistantRecommendation } from "./operator.types";

function toProposed(r: AssistantRecommendation): ProposedAction {
  return {
    domain: "growth" as const,
    entityType: "operator_assistant",
    entityId: r.targetId ?? null,
    actionType: `operator.${r.actionType.toLowerCase()}`,
    title: r.title,
    summary: r.summary,
    severity: r.confidenceLabel === "HIGH" ? "low" : "medium",
    riskLevel: "MEDIUM" as PlatformAutopilotRiskClass,
    recommendedPayload: {
      source: r.source,
      operatorAction: r.operatorAction,
      mode: "MANUAL_REVIEW_ONLY",
      recommendationId: r.id,
      operatorV2BudgetSyncEligible:
        operatorV2Flags.operatorV2BudgetSyncV1 && isExternallySyncableBudgetAction(r.actionType),
    },
    reasons: {
      confidence: r.confidenceScore,
      evidenceQuality: r.evidenceQuality,
      reason: r.reason,
    },
    subjectUserId: null,
    audience: "admin" as const,
  };
}

function monitorProposed(r: AssistantRecommendation, priorityScore: number): ProposedAction {
  return {
    domain: "growth" as const,
    entityType: "operator_assistant",
    entityId: r.targetId ?? null,
    actionType: "operator.monitor",
    title: `Monitor: ${r.title}`,
    summary:
      "Confidence is low — observe metrics and conflicts before changing spend or creative. No automated execution.",
    severity: "medium",
    riskLevel: "LOW" as PlatformAutopilotRiskClass,
    recommendedPayload: {
      source: r.source,
      recommendationId: r.id,
      mode: "MONITOR_ONLY",
      priorityScore,
      operatorV2ExecutionBrain: true,
    },
    reasons: {
      confidence: r.confidenceScore,
      reason: "Operator V2 execution plan: low confidence slot converted to monitor proposal.",
    },
    subjectUserId: null,
    audience: "admin" as const,
  };
}

/**
 * Bridges assistant recommendations into the autopilot proposal shape for review UIs — no execution.
 * When Operator V2 execution plan is enabled, uses ranked + capped plan (not raw list order).
 */
export async function assistantRecommendationsToProposedActions(
  recs: AssistantRecommendation[],
  opts?: { environment?: "development" | "staging" | "production" },
): Promise<ProposedAction[]> {
  if (!operatorV2Flags.operatorV2ExecutionPlanV1) {
    return recs.map(toProposed);
  }

  const env = opts?.environment ?? "production";
  const plan = await buildExecutionPlan({
    recommendations: recs,
    environment: env,
    resolveConflicts: operatorV2Flags.operatorV2ConflictEngineV1,
  });

  const top = plan.ordered.slice(0, 5);
  const out: ProposedAction[] = [];
  for (const s of top) {
    const r = recs.find((x) => x.id === s.id);
    if (!r) continue;
    const low = r.confidenceLabel === "LOW" || r.confidenceScore < 0.45;
    if (low) {
      out.push(monitorProposed(r, s.priorityScore));
    } else {
      const p = toProposed(r);
      p.recommendedPayload = {
        ...p.recommendedPayload,
        operatorV2PriorityScore: s.priorityScore,
        operatorV2TrustScore: s.trustScore,
        operatorV2ExecutionBrain: true,
      };
      p.reasons = {
        ...p.reasons,
        priorityScore: s.priorityScore,
        trustScore: s.trustScore,
        conflictGroup: s.conflictGroup,
      };
      out.push(p);
    }
  }
  return out;
}
