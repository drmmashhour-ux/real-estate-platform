import { prisma } from "@/lib/db";
import { validateExactAllForms } from "@/modules/oaciq-mapper/validation/exact-validation.service";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import type { LecipmExecutionPipelineState } from "@prisma/client";

export type ApprovalReadiness = {
  canApprove: boolean;
  blockers: string[];
  criticalCount: number;
};

/**
 * Broker-only gate: confirms mapping/validation snapshot before execution prep.
 * Does not certify OACIQ compliance — broker remains accountable to publisher rules.
 */
export async function assessApprovalReadiness(
  dealId: string,
  activeFormKeys: string[],
): Promise<ApprovalReadiness> {
  const deal = await loadDealForMapper(dealId);
  if (!deal) return { canApprove: false, blockers: ["Deal not found"], criticalCount: 0 };

  const canonical = buildCanonicalDealShape(deal);
  const { globalIssues, perForm } = validateExactAllForms(deal, canonical, activeFormKeys);
  const criticals = [
    ...globalIssues.filter((i) => i.severity === "critical"),
    ...Object.values(perForm).flatMap((r) => r.crossDocumentCriticals),
  ];
  const blockers = criticals.map((c) => c.message);
  if (activeFormKeys.length === 0) {
    blockers.push("Select at least one active form key for validation snapshot.");
  }
  return {
    canApprove: criticals.length === 0 && activeFormKeys.length > 0,
    blockers,
    criticalCount: criticals.length,
  };
}

export async function recordBrokerApproval(input: {
  dealId: string;
  approvedById: string;
  notes?: string | null;
  snapshot?: Record<string, unknown>;
}): Promise<{ id: string; approvedAt: Date }> {
  const row = await prisma.dealExecutionApproval.create({
    data: {
      dealId: input.dealId,
      approvedById: input.approvedById,
      notes: input.notes ?? null,
      snapshot: (input.snapshot ?? {}) as object,
    },
  });
  await prisma.deal.update({
    where: { id: input.dealId },
    data: { lecipmExecutionPipelineState: "broker_approved" satisfies LecipmExecutionPipelineState },
  });
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.approvedById,
      actionKey: "broker_execution_approval",
      payload: { approvalId: row.id },
    },
  });
  return { id: row.id, approvedAt: row.approvedAt };
}
