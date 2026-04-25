import { evaluateGuardrails } from "@/lib/compliance/guardrails";
import { createGuardrailDecision, queueManualReview } from "@/lib/compliance/guardrail-decisions";
import type { GuardrailFacts } from "@/lib/compliance/guardrails";

export type EnforceComplianceActionInput = {
  ownerType: string;
  ownerId: string;
  moduleKey: string;
  actionKey: string;
  entityType: string;
  entityId?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  facts: GuardrailFacts;
  /** When set, manual-review queue rows are scoped here (e.g. supervising licensee) while decisions may use `ownerType`/`ownerId`. */
  manualReviewOwnerType?: string;
  manualReviewOwnerId?: string;
};

export type EnforceComplianceActionResult = {
  allowed: boolean;
  outcome: string;
  severity: string;
  message?: string;
  reasonCode?: string;
  decisionId: string;
};

export async function enforceComplianceAction(
  input: EnforceComplianceActionInput,
): Promise<EnforceComplianceActionResult> {
  const result = evaluateGuardrails({
    moduleKey: input.moduleKey,
    actionKey: input.actionKey,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actorType: input.actorType ?? null,
    actorId: input.actorId ?? null,
    facts: input.facts,
  });

  const message = result.allowed
    ? (result.message ?? "Action allowed by compliance guardrails.")
    : result.message;

  const decision = await createGuardrailDecision({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    moduleKey: input.moduleKey,
    actionKey: input.actionKey,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actorType: input.actorType ?? null,
    actorId: input.actorId ?? null,
    outcome: result.outcome,
    severity: result.severity,
    reasonCode: !result.allowed ? result.reasonCode : null,
    message,
    overrideAllowed: !result.allowed && "overrideAllowed" in result ? !!result.overrideAllowed : false,
    details: {
      facts: input.facts,
    },
  });

  if (!result.allowed && result.outcome === "manual_review_required") {
    const qOwnerType = input.manualReviewOwnerType ?? input.ownerType;
    const qOwnerId = input.manualReviewOwnerId ?? input.ownerId;
    await queueManualReview({
      ownerType: qOwnerType,
      ownerId: qOwnerId,
      moduleKey: input.moduleKey,
      actionKey: input.actionKey,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      decisionId: decision.id,
      priority: result.severity === "critical" ? "urgent" : "high",
      reason: message,
    });
  }

  return {
    allowed: result.allowed,
    outcome: result.outcome,
    severity: result.severity,
    message,
    reasonCode: !result.allowed ? result.reasonCode : undefined,
    decisionId: decision.id,
  };
}
