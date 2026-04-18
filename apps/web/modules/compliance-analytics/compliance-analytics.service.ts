import { prisma } from "@/lib/db";
import { complianceDisclaimer } from "@/modules/compliance-admin/compliance-explainer";
import type { ComplianceAnalyticsPayload, ComplianceAnalyticsWindow } from "./compliance-analytics.types";

function rangeForWindow(w: ComplianceAnalyticsWindow, custom?: { from: string; to: string }) {
  const end = new Date();
  if (w === "custom" && custom) {
    return { start: new Date(custom.from), end: new Date(custom.to) };
  }
  const start = new Date();
  if (w === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  const days = w === "7d" ? 7 : w === "30d" ? 30 : 90;
  start.setTime(end.getTime() - days * 86400000);
  return { start, end };
}

export async function getComplianceAnalytics(
  window: ComplianceAnalyticsWindow,
  custom?: { from: string; to: string },
): Promise<ComplianceAnalyticsPayload> {
  const { start, end } = rangeForWindow(window, custom);

  const [
    openCases,
    criticalCases,
    completedReviews,
    changesRequired,
    escalations,
    totalEscalations,
    blockedClosings,
    caseGroups,
  ] = await Promise.all([
    prisma.complianceCase.count({
      where: { status: { in: ["open", "under_review", "action_required"] } },
    }),
    prisma.complianceCase.count({
      where: { severity: "critical", status: { notIn: ["resolved", "dismissed", "archived"] } },
    }),
    prisma.qaReview.findMany({
      where: { status: "completed", updatedAt: { gte: start, lte: end } },
      select: { createdAt: true, updatedAt: true, outcome: true },
      take: 500,
    }),
    prisma.qaReview.count({
      where: { outcome: "changes_required", updatedAt: { gte: start, lte: end } },
    }),
    prisma.complianceEscalation.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.complianceEscalation.count(),
    prisma.complianceCase.count({
      where: { caseType: "closing_readiness_risk", status: { notIn: ["resolved", "dismissed", "archived"] } },
    }),
    prisma.complianceCase.groupBy({
      by: ["caseType"],
      _count: { id: true },
      where: { createdAt: { gte: start, lte: end } },
    }),
  ]);

  let turnaroundSum = 0;
  let turnaroundN = 0;
  for (const r of completedReviews) {
    turnaroundSum += (r.updatedAt.getTime() - r.createdAt.getTime()) / 86400000;
    turnaroundN += 1;
  }

  const avgReviewTurnaroundDays = turnaroundN ? Math.round((turnaroundSum / turnaroundN) * 10) / 10 : null;
  const changesRequiredRate = completedReviews.length ? changesRequired / completedReviews.length : null;
  const escalationRate = totalEscalations > 0 ? escalations / totalEscalations : null;

  return {
    window,
    openCases,
    criticalCases,
    avgReviewTurnaroundDays,
    changesRequiredRate,
    escalationRate,
    topFindingCategories: caseGroups.map((g) => ({ caseType: g.caseType, count: g._count.id })),
    blockedClosings,
    generatedAt: new Date().toISOString(),
    disclaimer: complianceDisclaimer(),
  };
}
