import { prisma } from "@/lib/db";
import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";
import { runAllComplianceRules } from "@/modules/compliance-rules/compliance-rule-engine";
import type { ComplianceRuleHit } from "@/modules/compliance-rules/compliance-rules.types";
import { complianceDisclaimer } from "./compliance-explainer";

const OPEN_STATUSES = ["open", "under_review", "action_required"] as const;

export async function runComplianceEngineForDeal(dealId: string, actorUserId: string) {
  const hits = await runAllComplianceRules(dealId);
  let casesTouched = 0;
  let findingsCreated = 0;

  for (const hit of hits) {
    const res = await persistRuleHit(dealId, hit, actorUserId);
    if (res.caseTouched) casesTouched += 1;
    findingsCreated += res.findingsCreated;
  }

  await logComplianceAudit({
    actorUserId,
    actionKey: complianceAuditKeys.ruleEngineRun,
    payload: { dealId, hits: hits.length, casesTouched, findingsCreated },
  });

  return { hits, casesTouched, findingsCreated, disclaimer: complianceDisclaimer() };
}

async function persistRuleHit(
  dealId: string,
  hit: ComplianceRuleHit,
  actorUserId: string,
): Promise<{ caseTouched: boolean; findingsCreated: number }> {
  let existing = await prisma.complianceCase.findFirst({
    where: {
      dealId,
      caseType: hit.caseType,
      status: { in: [...OPEN_STATUSES] },
    },
  });

  let caseTouched = false;
  let findingsCreated = 0;

  if (!existing) {
    existing = await prisma.complianceCase.create({
      data: {
        dealId,
        caseType: hit.caseType,
        severity: hit.severity,
        status: "open",
        summary: hit.summary,
        findings: { ruleKey: hit.ruleKey } as object,
        openedBySystem: true,
      },
    });
    caseTouched = true;
    await logComplianceAudit({
      actorUserId,
      actionKey: complianceAuditKeys.caseOpened,
      caseId: existing.id,
      payload: { ruleKey: hit.ruleKey, dealId },
    });
  }

  await prisma.complianceFinding.create({
    data: {
      caseId: existing.id,
      findingType: hit.findingType,
      severity: hit.severity,
      title: hit.title,
      summary: hit.summary,
      affectedEntityType: hit.affectedEntities[0]?.type,
      affectedEntityId: hit.affectedEntities[0]?.id,
      sourceRefs: (hit.sourceRefs ?? []) as object,
      metadata: { ruleKey: hit.ruleKey, reasons: hit.reasons, suggestedActions: hit.suggestedActions } as object,
    },
  });
  findingsCreated = 1;

  return { caseTouched, findingsCreated };
}

export async function listComplianceCases(q: {
  status?: string;
  severity?: string;
  take?: number;
}) {
  return prisma.complianceCase.findMany({
    where: {
      ...(q.status ? { status: q.status as import("@prisma/client").ComplianceCaseStatus } : {}),
      ...(q.severity ? { severity: q.severity as import("@prisma/client").ComplianceCaseSeverity } : {}),
    },
    orderBy: [{ severity: "desc" }, { updatedAt: "desc" }],
    take: q.take ?? 80,
    include: {
      complianceFindings: { take: 20, orderBy: { createdAt: "desc" } },
      deal: { select: { id: true, dealCode: true, status: true, brokerId: true } },
    },
  });
}

export async function getComplianceCaseById(id: string) {
  return prisma.complianceCase.findUnique({
    where: { id },
    include: {
      complianceFindings: { orderBy: { createdAt: "desc" } },
      escalations: { orderBy: { createdAt: "desc" } },
      deal: { select: { id: true, dealCode: true, status: true, brokerId: true, lecipmExecutionPipelineState: true } },
    },
  });
}

export async function updateComplianceCase(
  id: string,
  actorUserId: string,
  patch: {
    status?: import("@prisma/client").ComplianceCaseStatus;
    assignedReviewerId?: string | null;
    summary?: string;
  },
) {
  const row = await prisma.complianceCase.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.assignedReviewerId !== undefined ? { assignedReviewerId: patch.assignedReviewerId } : {}),
      ...(patch.summary ? { summary: patch.summary } : {}),
    },
  });

  await logComplianceAudit({
    actorUserId,
    actionKey: patch.status === "resolved" ? complianceAuditKeys.caseResolved : complianceAuditKeys.caseUpdated,
    caseId: id,
    payload: patch as Record<string, unknown>,
  });

  return row;
}
