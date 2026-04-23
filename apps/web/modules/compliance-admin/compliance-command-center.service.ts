import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";
import { prisma } from "@/lib/db";
import { evaluateBrokerInsuranceRiskBatch } from "@/modules/compliance/insurance/insurance-risk.engine";
import { MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD } from "@/modules/compliance/insurance/insurance.types";
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
  insuranceMonitoring: {
    expiringSoon: any[];
    highRiskBrokers: any[];
    recentClaims: any[];
  };
};

async function getInsuranceMonitoring() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

  const [expiringSoon, recentClaims] = await Promise.all([
    prisma.brokerInsurance.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gt: now, lte: thirtyDaysFromNow },
        coveragePerLoss: { gte: MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD },
      },
      include: { broker: { select: { id: true, name: true } } },
      take: 12,
      orderBy: { endDate: "asc" },
    }),
    prisma.insuranceClaim.findMany({
      where: {
        createdAt: { gte: new Date(now.getTime() - 90 * 86400000) },
      },
      include: { broker: { select: { id: true, name: true } } },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const candidateBrokerIds = [
    ...new Set([...expiringSoon.map((p) => p.brokerId), ...recentClaims.map((c) => c.brokerId)]),
  ];

  const riskMap =
    candidateBrokerIds.length > 0
      ? await evaluateBrokerInsuranceRiskBatch(candidateBrokerIds.slice(0, 48))
      : new Map();

  const highRiskIds = candidateBrokerIds
    .filter((id) => (riskMap.get(id)?.riskScore ?? 0) >= 55)
    .sort((a, b) => (riskMap.get(b)?.riskScore ?? 0) - (riskMap.get(a)?.riskScore ?? 0))
    .slice(0, 10);

  const users =
    highRiskIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: highRiskIds } },
          select: { id: true, name: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const highRiskBrokers = highRiskIds.map((id) => {
    const r = riskMap.get(id);
    return {
      id,
      broker: { id, name: userMap.get(id) ?? "Broker" },
      message: `${r?.riskScore ?? "—"} · ${(r?.flags[0] ?? "Insurance risk review").slice(0, 120)}`,
    };
  });

  return { expiringSoon, highRiskBrokers, recentClaims };
}

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
  const [analytics, cases, reviews, queues, severityTrends30d, recentEscalations, checklistStats, insuranceMonitoring] = await Promise.all([
    getComplianceAnalytics(input.window, input.custom),
    listComplianceCases({ take: 50 }),
    listQaReviews({ take: 50 }),
    getSupervisoryQueues(),
    getCaseSeverityTrends(30),
    listRecentEscalations(),
    getChecklistStatusCounts(),
    getInsuranceMonitoring(),
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
    insuranceMonitoring,
  };
}
