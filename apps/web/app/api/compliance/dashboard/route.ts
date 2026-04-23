import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import {
  buildDashboardMetrics,
  deriveExecutiveStatus,
  deriveReadinessForInspection,
  EXECUTIVE_CRITICAL_HIGH_RISK_THRESHOLD,
} from "@/lib/compliance/dashboard-metrics";

export const dynamic = "force-dynamic";

/**
 * Broker / executive command center: aggregated metrics, cockpit alerts (`ComplianceAlert`), review queue slice.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "solo_broker";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : auth.user.id;

  if (auth.user.role === PlatformRole.BROKER) {
    if (ownerType === "agency") {
      return NextResponse.json(
        { success: false, error: "Agency scope not available for this account" },
        { status: 403 },
      );
    }
    if (ownerType === "solo_broker" && ownerId !== auth.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const access = await assertComplianceOwnerAccess(auth.user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    complaints,
    highRisk,
    trustIssues,
    openReviews,
    legalHolds,
    alerts,
    reviewQueue,
    latestScore,
    guardrailEscalations30d,
  ] = await Promise.all([
    prisma.complaintCase.count({
      where: { ownerType, ownerId },
    }),
    prisma.complianceRiskEvent.count({
      where: { ownerType, ownerId, severity: "critical" },
    }),
    prisma.complianceRiskEvent.count({
      where: { ownerType, ownerId, riskType: "trust_issue" },
    }),
    prisma.complianceManualReviewQueue.count({
      where: { ownerType, ownerId, status: "open" },
    }),
    prisma.legalHold.count({
      where: { ownerType, ownerId, active: true },
    }),
    prisma.complianceAlert.findMany({
      where: { ownerType, ownerId, acknowledged: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.complianceManualReviewQueue.findMany({
      where: { ownerType, ownerId, status: "open" },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.complianceScore.findFirst({
      where: { ownerType, ownerId, scopeType: "global", scopeId: null },
      orderBy: { lastComputedAt: "desc" },
    }),
    prisma.complianceGuardrailDecision.count({
      where: {
        ownerType,
        ownerId,
        outcome: { in: ["hard_blocked", "manual_review_required"] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const metrics = buildDashboardMetrics({
    complaints,
    highRisk,
    trustIssues,
    openReviews,
    legalHolds,
  });

  const executiveStatus = deriveExecutiveStatus(metrics);

  const systemHealth =
    executiveStatus === "CRITICAL" ? "Critical" : executiveStatus === "ELEVATED" ? "Elevated" : "Normal";

  const readinessForInspection = deriveReadinessForInspection({
    executiveStatus,
    openReviewCount: openReviews,
    unackedAlertCount: alerts.length,
    grade: latestScore?.grade ?? null,
  });

  return NextResponse.json({
    success: true,
    metrics,
    alerts,
    reviewQueue,
    executiveStatus,
    executiveView: {
      systemHealth,
      complianceGrade: latestScore?.grade ?? null,
      readinessForInspection,
    },
    executiveRule: {
      highRiskThreshold: EXECUTIVE_CRITICAL_HIGH_RISK_THRESHOLD,
      critical: executiveStatus === "CRITICAL",
    },
    guardrailEscalations30d,
    /**
     * Metric counts matching command-center contract (`complaints`, `highRiskCases`, …).
     * Open manual-review rows remain in `reviewQueue` (array).
     */
    cockpitSummary: {
      complaints: metrics.complaints,
      highRiskCases: metrics.highRiskCases,
      trustIssues: metrics.trustIssues,
      reviewQueue: metrics.reviewQueue,
      legalHolds: metrics.legalHolds,
    },
    systemStatus: executiveStatus,
  });
}
