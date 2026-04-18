import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";
import { prisma } from "@/lib/db";
import { getComplianceAnalytics } from "@/modules/compliance-analytics/compliance-analytics.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";
import { getCaseSeverityTrends } from "@/modules/compliance-analytics/risk-trends.service";
import { getSupervisoryQueues } from "@/modules/compliance-ops/supervisory-queue.service";
import { listComplianceCases } from "./compliance-admin.service";
import { listQaReviews } from "@/modules/qa-review/qa-review.service";

export type ComplianceCommandCenterPayload = {
  window: ComplianceAnalyticsWindow;
  analytics: Awaited<ReturnType<typeof getComplianceAnalytics>>;
  cases: Awaited<ReturnType<typeof listComplianceCases>>;
  reviews: Awaited<ReturnType<typeof listQaReviews>>;
  queues: Awaited<ReturnType<typeof getSupervisoryQueues>>;
  severityTrends30d: Awaited<ReturnType<typeof getCaseSeverityTrends>>;
  recentEscalations: Awaited<ReturnType<typeof listRecentEscalations>>;
  checklistStats: Awaited<ReturnType<typeof getChecklistStatusCounts>>;
};

async function listRecentEscalations() {
  return prisma.complianceEscalation.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      complianceCase: { select: { id: true, summary: true, severity: true, dealId: true, status: true } },
    },
  });
}

async function getChecklistStatusCounts() {
  const rows = await prisma.qaReviewChecklistItem.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const base = { pending: 0, passed: 0, failed: 0, skipped: 0 };
  for (const r of rows) {
    if (r.status === "pending") base.pending = r._count.id;
    if (r.status === "passed") base.passed = r._count.id;
    if (r.status === "failed") base.failed = r._count.id;
    if (r.status === "skipped") base.skipped = r._count.id;
  }
  return base;
}

export async function loadComplianceCommandCenterPayload(input: {
  actorUserId: string;
  window: ComplianceAnalyticsWindow;
  custom?: { from: string; to: string };
  auditSurface: "overview" | "cases" | "reviews" | "analytics";
}): Promise<ComplianceCommandCenterPayload> {
  const [analytics, cases, reviews, queues, severityTrends30d, recentEscalations, checklistStats] = await Promise.all([
    getComplianceAnalytics(input.window, input.custom),
    listComplianceCases({ take: 50 }),
    listQaReviews({ take: 50 }),
    getSupervisoryQueues(),
    getCaseSeverityTrends(30),
    listRecentEscalations(),
    getChecklistStatusCounts(),
  ]);

  await logComplianceAudit({
    actorUserId: input.actorUserId,
    actionKey: complianceAuditKeys.commandCenterViewed,
    payload: { surface: input.auditSurface, window: input.window },
  });

  return {
    window: input.window,
    analytics,
    cases,
    reviews,
    queues,
    severityTrends30d,
    recentEscalations,
    checklistStats,
  };
}
