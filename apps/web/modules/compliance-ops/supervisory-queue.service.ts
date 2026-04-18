import { prisma } from "@/lib/db";

export async function getSupervisoryQueues() {
  const [criticalCases, overdueReviews, blockedDeals, openEscalations] = await Promise.all([
    prisma.complianceCase.count({ where: { severity: "critical", status: { in: ["open", "under_review", "action_required"] } } }),
    prisma.qaReview.count({
      where: {
        status: { in: ["pending", "in_progress"] },
        updatedAt: { lt: new Date(Date.now() - 5 * 86400000) },
      },
    }),
    prisma.complianceCase.count({
      where: { caseType: "closing_readiness_risk", status: { notIn: ["resolved", "dismissed", "archived"] } },
    }),
    prisma.complianceEscalation.count({ where: { status: { in: ["open", "acknowledged"] } } }),
  ]);

  return {
    criticalComplianceCases: criticalCases,
    overdueQaReviews: overdueReviews,
    closingReadinessCases: blockedDeals,
    openEscalations,
  };
}
