import type { PrismaClient } from "@prisma/client";

/** Throws when pending (unreviewed) proposals exist for the case. */
export async function assertNoUnreviewedAdjustmentProposals(
  prisma: PrismaClient,
  appraisalCaseId: string,
): Promise<void> {
  const n = await prisma.appraisalAdjustmentProposal.count({
    where: { appraisalCaseId, reviewed: false },
  });
  if (n > 0) {
    throw new Error("UNREVIEWED_ADJUSTMENT_PROPOSALS_PRESENT");
  }
}

/** Throws when any proposal exists that has not been reviewed — use before “finalizing” a valuation narrative. */
export async function assertAdjustmentReviewCompleteForCase(
  prisma: PrismaClient,
  appraisalCaseId: string,
): Promise<void> {
  await assertNoUnreviewedAdjustmentProposals(prisma, appraisalCaseId);
}

/**
 * When finalizing an appraisal-like output, require that there are no outstanding proposals
 * OR that explicitly `skipProposalGate` is true (caller documents risk).
 */
export async function assertAppraisalFinalizationAdjustmentPolicy(input: {
  prisma: PrismaClient;
  appraisalCaseId: string;
  /** If true, skips the check (no proposals required). */
  skipProposalGate?: boolean;
}): Promise<void> {
  if (input.skipProposalGate) return;
  const pending = await input.prisma.appraisalAdjustmentProposal.count({
    where: { appraisalCaseId: input.appraisalCaseId, reviewed: false },
  });
  if (pending > 0) {
    throw new Error("ADJUSTMENT_REVIEW_REQUIRED");
  }
}

export function assertAiAdjustmentRequiresBrokerApproval(wasApprovedByBroker: boolean): void {
  if (!wasApprovedByBroker) {
    throw new Error("AI_ADJUSTMENT_REQUIRES_BROKER_APPROVAL");
  }
}
