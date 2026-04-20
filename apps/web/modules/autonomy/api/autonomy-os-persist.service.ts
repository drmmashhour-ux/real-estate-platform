import { prisma } from "@/lib/db";

import type { DynamicPricingDecision } from "../types/autonomy.types";
import type { ProposedAction } from "../types/autonomy.types";

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
