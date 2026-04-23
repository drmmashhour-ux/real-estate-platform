import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { computeComplianceScore } from "@/lib/compliance/scoring";
import { detectComplaintSpikeAnomaly } from "@/lib/compliance/anomaly";
import { generateRiskEvent } from "@/lib/compliance/risk";
import { deriveComplianceIntelligenceFlags } from "@/lib/compliance/intelligence-flags";
import { normalizeHealthOwner } from "@/lib/compliance/health-owner";
import { createComplianceAlert } from "@/lib/compliance/alerts";

export const dynamic = "force-dynamic";

const DEDUPE_MS = 6 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawOwnerType = typeof body.ownerType === "string" ? body.ownerType : "solo_broker";
  const rawOwnerId = typeof body.ownerId === "string" ? body.ownerId : user.id;
  const scopeType = typeof body.scopeType === "string" ? body.scopeType.trim() : "global";
  const scopeId =
    typeof body.scopeId === "string" && body.scopeId.trim() ? body.scopeId.trim() : null;

  const { ownerType, ownerId } = normalizeHealthOwner(rawOwnerType, rawOwnerId);

  if (user.role === PlatformRole.BROKER) {
    if (ownerType === "agency") {
      return NextResponse.json({ success: false, error: "Agency scope not available for this account" }, { status: 403 });
    }
    if (ownerType === "solo_broker" && ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [complaints, complaintsRecentWindow, complaintsPriorWindow, riskEventTrustIssues, anomalyCount] =
    await Promise.all([
      prisma.complaintCase.count({
        where: { ownerType, ownerId },
      }),
      prisma.complaintCase.count({
        where: { ownerType, ownerId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.complaintCase.count({
        where: {
          ownerType,
          ownerId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.complianceRiskEvent.count({
        where: {
          ownerType,
          ownerId,
          riskType: { in: ["trust_issue", "late_deposit"] },
        },
      }),
      prisma.complianceAnomaly.count({
        where: { entityType: ownerType, entityId: ownerId },
      }),
    ]);

  let trustDepositSignals = 0;
  if (ownerType === "solo_broker") {
    trustDepositSignals = await prisma.trustDeposit.count({
      where: {
        brokerId: ownerId,
        status: { in: ["disputed", "frozen"] },
      },
    });
  } else if (ownerType === "agency") {
    trustDepositSignals = await prisma.trustDeposit.count({
      where: {
        agencyId: ownerId,
        status: { in: ["disputed", "frozen"] },
      },
    });
  }

  const trustIssues = riskEventTrustIssues + trustDepositSignals;
  const missingDocs = 0;

  const spike = detectComplaintSpikeAnomaly({
    avgComplaints: complaintsPriorWindow,
    currentComplaints: complaintsRecentWindow,
  });

  const anomaliesForScore = anomalyCount + (spike ? 1 : 0);

  const result = computeComplianceScore({
    missingDocs,
    complaints,
    trustIssues,
    anomalies: anomaliesForScore,
  });

  const flags = deriveComplianceIntelligenceFlags({
    riskLevel: result.riskLevel,
    complaintsRecentWindow,
    complaintsPriorWindow,
  });

  if (spike) {
    await prisma.complianceAnomaly.create({
      data: {
        entityType: ownerType,
        entityId: ownerId,
        anomalyType: spike.anomalyType,
        description: spike.description,
        baselineValue: spike.baselineValue,
        detectedValue: spike.detectedValue,
        severity: spike.severity,
      },
    });
  }

  if (flags.triggerAuditFlag) {
    const since = new Date(Date.now() - DEDUPE_MS);
    const dup = await prisma.complianceRiskEvent.findFirst({
      where: {
        ownerType,
        ownerId,
        riskType: "complaint_cluster",
        createdAt: { gte: since },
      },
    });
    if (!dup) {
      const ev = generateRiskEvent({
        type: "complaint_cluster",
        severity: "high",
        description: "Multiple complaints in a short period versus prior window — review intake and routing.",
      });
      await prisma.complianceRiskEvent.create({
        data: {
          ownerType,
          ownerId,
          relatedEntityType: "broker_scope",
          relatedEntityId: null,
          riskType: ev.riskType,
          severity: ev.severity,
          description: ev.description,
          detectedBy: ev.detectedBy,
        },
      });
    }
  }

  const requireManualReview = result.riskLevel === "critical";

  const scoreRow = await prisma.complianceScore.create({
    data: {
      ownerType,
      ownerId,
      scopeType,
      scopeId,
      score: result.score,
      grade: result.grade,
      riskLevel: result.riskLevel,
      lastComputedAt: new Date(),
      factors: {
        missingDocs,
        complaints,
        complaintsRecentWindow,
        complaintsPriorWindow,
        trustIssues,
        trustDepositSignals,
        riskEventTrustIssues,
        anomaliesStoredBeforeRun: anomalyCount,
        anomaliesUsedForScore: anomaliesForScore,
        anomalyDetected: !!spike,
        flags,
        requireManualReview,
      },
    },
  });

  if (requireManualReview) {
    const existingOpen = await prisma.complianceManualReviewQueue.findFirst({
      where: {
        ownerType,
        ownerId,
        moduleKey: "intelligence",
        actionKey: "compliance_score_critical",
        status: "open",
      },
    });
    if (!existingOpen) {
      await prisma.complianceManualReviewQueue.create({
        data: {
          ownerType,
          ownerId,
          moduleKey: "intelligence",
          actionKey: "compliance_score_critical",
          entityType: "compliance_score",
          entityId: scoreRow.id,
          priority: "urgent",
          reason: "Compliance score reached critical risk level — manual executive review required.",
          status: "open",
        },
      });
    }

    const recentAlert = await prisma.complianceAlert.findFirst({
      where: {
        ownerType,
        ownerId,
        alertType: "risk",
        acknowledged: false,
        createdAt: { gte: new Date(now.getTime() - DEDUPE_MS) },
      },
    });
    if (!recentAlert) {
      await createComplianceAlert({
        ownerType,
        ownerId,
        alertType: "risk",
        severity: "critical",
        title: "Critical compliance risk detected",
        description: "Immediate review required",
        entityType: "compliance_score",
        entityId: scoreRow.id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    score: scoreRow,
    flags,
    spike,
    requireManualReview,
  });
}
