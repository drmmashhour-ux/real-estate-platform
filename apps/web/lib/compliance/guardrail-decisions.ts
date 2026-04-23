import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { createComplianceAlert } from "@/lib/compliance/alerts";

function buildDecisionNumber() {
  const now = new Date();
  return `GRD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

export type CreateGuardrailDecisionInput = {
  ownerType: string;
  ownerId: string;
  moduleKey: string;
  actionKey: string;
  entityType: string;
  entityId?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  outcome: "allowed" | "warned" | "soft_blocked" | "hard_blocked" | "manual_review_required";
  severity: string;
  triggeredRuleKey?: string | null;
  reasonCode?: string | null;
  message: string;
  aiAssisted?: boolean;
  overrideAllowed?: boolean;
  details?: Record<string, unknown> | null;
};

export async function createGuardrailDecision(input: CreateGuardrailDecisionInput) {
  const decision = await prisma.complianceGuardrailDecision.create({
    data: {
      decisionNumber: buildDecisionNumber(),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      moduleKey: input.moduleKey,
      actionKey: input.actionKey,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actorType: input.actorType ?? null,
      actorId: input.actorId ?? null,
      outcome: input.outcome,
      severity: input.severity,
      triggeredRuleKey: input.triggeredRuleKey ?? null,
      reasonCode: input.reasonCode ?? null,
      message: input.message,
      aiAssisted: input.aiAssisted ?? false,
      overrideAllowed: input.overrideAllowed ?? false,
      details: input.details ?? undefined,
    },
  });

  await logAuditEvent({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    entityType: "guardrail_decision",
    entityId: decision.id,
    actionType: input.outcome,
    moduleKey: "general",
    actorType: input.actorType ?? undefined,
    actorId: input.actorId ?? undefined,
    aiAssisted: input.aiAssisted ?? false,
    severity: input.severity,
    summary: input.message,
    details: {
      actionKey: input.actionKey,
      reasonCode: input.reasonCode ?? null,
      decisionNumber: decision.decisionNumber,
    },
  });

  if (
    (input.outcome === "hard_blocked" || input.outcome === "manual_review_required") &&
    (input.severity === "critical" || input.severity === "high")
  ) {
    const isCritical = input.severity === "critical";
    await createComplianceAlert({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      alertType: "guardrail_block",
      severity: input.severity,
      title: isCritical ? "Critical risk detected" : "High-risk guardrail block",
      description: isCritical ? `${input.message}\n\nImmediate action required.` : input.message,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
    }).catch(() => undefined);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reasonKey = (input.reasonCode ?? input.triggeredRuleKey ?? "unknown").trim() || "unknown";
    const repeatCount = await prisma.complianceGuardrailDecision.count({
      where: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        outcome: { in: ["hard_blocked", "manual_review_required"] },
        OR: [{ reasonCode: reasonKey }, { triggeredRuleKey: reasonKey }],
        createdAt: { gte: since },
      },
    });
    if (reasonKey !== "unknown" && repeatCount >= 3) {
      const dup = await prisma.complianceAlert.findFirst({
        where: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          alertType: "repeated_violations",
          acknowledged: false,
          createdAt: { gte: since },
        },
      });
      if (!dup) {
        await createComplianceAlert({
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          alertType: "repeated_violations",
          severity: "critical",
          title: "Critical risk detected",
          description: `Repeated guardrail blocks (${repeatCount} in 24h) for rule ${reasonKey}. Immediate action required.`,
          entityType: input.entityType,
          entityId: input.entityId ?? undefined,
        }).catch(() => undefined);
      }
    }
  }

  return decision;
}

export async function queueManualReview(input: {
  ownerType: string;
  ownerId: string;
  moduleKey: string;
  actionKey: string;
  entityType: string;
  entityId?: string | null;
  decisionId?: string | null;
  priority?: "normal" | "high" | "urgent";
  reason: string;
  assignedToId?: string | null;
}) {
  return prisma.complianceManualReviewQueue.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      moduleKey: input.moduleKey,
      actionKey: input.actionKey,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      decisionId: input.decisionId ?? null,
      priority: input.priority ?? "high",
      reason: input.reason,
      assignedToId: input.assignedToId ?? null,
      status: "open",
    },
  });
}
