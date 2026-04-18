import { prisma } from "@/lib/db";

export async function markCommissionPendingReview(caseId: string, officeId: string) {
  return prisma.brokerageCommissionCase.update({
    where: { id: caseId, officeId },
    data: { status: "pending_review" },
  });
}
