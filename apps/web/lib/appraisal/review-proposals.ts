import { prisma } from "@/lib/db";
import { logAppraisalAdjustmentAudit } from "@/lib/appraisal/adjustment-audit";

function requireReviewerId(id: string): void {
  if (!id?.trim()) {
    throw new Error("REVIEWER_REQUIRED");
  }
}

export async function approveAdjustmentProposal(input: {
  proposalId: string;
  reviewedById: string;
}): Promise<Awaited<ReturnType<typeof prisma.appraisalAdjustmentProposal.update>>> {
  requireReviewerId(input.reviewedById);

  const existing = await prisma.appraisalAdjustmentProposal.findUnique({
    where: { id: input.proposalId },
  });
  if (!existing) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (existing.reviewed) {
    throw new Error("PROPOSAL_ALREADY_REVIEWED");
  }

  const proposal = await prisma.appraisalAdjustmentProposal.update({
    where: { id: input.proposalId },
    data: {
      reviewed: true,
      approved: true,
      reviewedById: input.reviewedById,
    },
  });

  await prisma.appraisalAdjustment.create({
    data: {
      proposalId: proposal.id,
      appraisalCaseId: proposal.appraisalCaseId,
      comparableId: proposal.comparableId,
      adjustmentType: proposal.adjustmentType,
      label: proposal.label,
      amountCents: proposal.suggestedAmountCents,
      direction: proposal.direction,
      rationale: proposal.rationale,
    },
  });

  await logAppraisalAdjustmentAudit({
    actorUserId: input.reviewedById,
    action: "proposal_approved",
    entityId: proposal.id,
    payload: { adjustmentType: proposal.adjustmentType },
  });

  await logAppraisalAdjustmentAudit({
    actorUserId: input.reviewedById,
    action: "adjustment_applied",
    entityId: proposal.id,
    payload: { appraisalCaseId: proposal.appraisalCaseId, comparableId: proposal.comparableId },
  });

  return proposal;
}

export async function rejectAdjustmentProposal(input: {
  proposalId: string;
  reviewedById: string;
}): Promise<Awaited<ReturnType<typeof prisma.appraisalAdjustmentProposal.update>>> {
  requireReviewerId(input.reviewedById);

  const existing = await prisma.appraisalAdjustmentProposal.findUnique({
    where: { id: input.proposalId },
  });
  if (!existing) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (existing.reviewed) {
    throw new Error("PROPOSAL_ALREADY_REVIEWED");
  }

  const updated = await prisma.appraisalAdjustmentProposal.update({
    where: { id: input.proposalId },
    data: {
      reviewed: true,
      approved: false,
      reviewedById: input.reviewedById,
    },
  });

  await logAppraisalAdjustmentAudit({
    actorUserId: input.reviewedById,
    action: "proposal_rejected",
    entityId: updated.id,
    payload: { adjustmentType: updated.adjustmentType },
  });

  return updated;
}
