import { prisma } from "@/lib/db";

import { isAutonomyOsLearningEnabled, isAutonomyOsLayerCoreEnabled } from "../lib/autonomy-layer-gate";
import type {
  AutonomyPolicyResult,
  DynamicPricingDecision,
  OutcomeEvent,
  ProposedAction,
} from "../types/autonomy.types";

/** Best-effort persistence — never throws to callers (audit trail only). */
export async function persistAutonomyPricingDecision(decision: DynamicPricingDecision): Promise<void> {
  try {
    await prisma.managerAiAutonomyPricingDecision.create({
      data: {
        listingId: decision.listingId,
        suggestedPrice: decision.suggestedPrice,
        confidence: decision.confidence,
        deltaFromBase: decision.deltaFromBase,
        factorsJson: decision.factors,
        policyResultsJson: decision.policyResults,
        shouldAutoApply: decision.shouldAutoApply,
      },
    });
  } catch {
    /* optional audit path */
  }
}

export async function persistAutonomyProposedAction(action: ProposedAction): Promise<void> {
  try {
    await prisma.managerAiAutonomyAction.create({
      data: {
        id: action.id,
        domain: action.domain,
        type: action.type,
        title: action.title,
        description: action.description,
        mode: action.mode,
        status: action.status,
        payloadJson: action.payload,
        expectedImpact: action.expectedImpact ?? undefined,
        policyResultsJson: action.policyResults,
        approvedAt: action.approvedAt ? new Date(action.approvedAt) : null,
        executedAt: action.executedAt ? new Date(action.executedAt) : null,
        rolledBackAt: action.rolledBackAt ? new Date(action.rolledBackAt) : null,
      },
    });
  } catch {
    /* optional audit path */
  }
}

/** Persists blocked or CRITICAL policy rows for dashboard / audit (core flag on). */
export function persistCriticalPolicyEvaluationResults(
  results: AutonomyPolicyResult[],
  contextJson?: Record<string, unknown>,
): void {
  if (!isAutonomyOsLayerCoreEnabled()) return;
  void (async () => {
    try {
      for (const r of results) {
        if (r.severity === "CRITICAL" || !r.allowed) {
          await prisma.managerAiAutonomyPolicyEvent.create({
            data: {
              ruleId: r.id,
              domain: r.domain,
              severity: r.severity,
              allowed: r.allowed,
              reason: r.reason,
              contextJson: contextJson ?? {},
            },
          });
        }
      }
    } catch {
      /* optional audit */
    }
  })();
}

export async function persistAutonomyOutcome(event: OutcomeEvent): Promise<void> {
  if (!isAutonomyOsLearningEnabled()) return;
  try {
    await prisma.managerAiAutonomyOutcome.create({
      data: {
        id: event.id,
        actionId: event.actionId,
        entityId: event.entityId,
        entityType: event.entityType,
        domain: event.domain,
        metric: event.metric,
        beforeValue: event.beforeValue ?? null,
        afterValue: event.afterValue ?? null,
        delta: event.delta ?? null,
        label: event.label,
        notes: event.notes ?? null,
        observedAt: new Date(event.observedAt),
      },
    });
  } catch {
    /* optional audit */
  }
}

export async function listRecentAutonomyPricingDecisions(limit = 10) {
  try {
    return await prisma.managerAiAutonomyPricingDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}
