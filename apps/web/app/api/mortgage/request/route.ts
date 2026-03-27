import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { notifyPrimaryBrokerNewMortgageLead } from "@/modules/mortgage/services/notify-primary-broker-lead";
import { assignMortgageBrokerForLead } from "@/modules/mortgage/services/lead-distribution";
import { computePreApprovalEstimate } from "@/modules/mortgage/services/preApproval";
import { computeLeadValueFromIntent } from "@/modules/mortgage/services/lead-value";
import { parseMortgageTimeline, scoreMortgageIntentLevel } from "@/modules/mortgage/services/score-mortgage-intent";
import { recordBuyerGrowthEvent } from "@/lib/buyer/buyer-analytics";
import { assertMortgageRequestAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { syncMortgageReadinessOnRequestSaved } from "@/lib/trustgraph/application/integrations/mortgageFileIntegration";
import { syncMortgageDocumentExtraction } from "@/lib/trustgraph/application/integrations/mortgageDocumentIntegration";

export const dynamic = "force-dynamic";

function parseMoney(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function parsePreApproved(v: unknown): boolean {
  if (v === true || v === "true" || v === "yes") return true;
  return false;
}

const CLIENT_CONFIRMATION =
  "Your request has been sent to a mortgage expert. You will be contacted shortly.";
const QUALIFICATION_HINT =
  "Based on your inputs, you may qualify for financing. A broker will confirm shortly.";

/** Create a mortgage evaluation request; assigns to the primary trusted broker only. */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (!legalEnforcementDisabled()) {
    const legal = await assertMortgageRequestAllowed(userId);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Accept the mortgage disclosure before submitting.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const propertyPrice = parseMoney(body.propertyPrice);
  const downPayment = parseMoney(body.downPayment);
  const income = parseMoney(body.income);
  const timeline = parseMortgageTimeline(body.timeline);
  const preApproved = parsePreApproved(body.preApproved);
  const fsboListingId =
    typeof body.fsboListingId === "string" && body.fsboListingId.trim() ? body.fsboListingId.trim() : null;
  const employmentStatus =
    typeof body.employmentStatus === "string" ? body.employmentStatus.trim().slice(0, 120) : null;
  const creditRange =
    typeof body.creditRange === "string" ? body.creditRange.trim().slice(0, 80) : null;

  if (propertyPrice === null || downPayment === null || income === null) {
    return NextResponse.json(
      { error: "propertyPrice, downPayment, and income must be non-negative numbers" },
      { status: 400 }
    );
  }

  if (!timeline) {
    return NextResponse.json(
      { error: "timeline must be immediate, 1-3 months, or 3+ months" },
      { status: 400 }
    );
  }

  if (downPayment > propertyPrice) {
    return NextResponse.json({ error: "Down payment cannot exceed property price" }, { status: 400 });
  }

  if (fsboListingId) {
    const l = await prisma.fsboListing.findUnique({
      where: { id: fsboListingId },
      select: { id: true, status: true, moderationStatus: true },
    });
    if (!l) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const { isFsboPubliclyVisible } = await import("@/lib/fsbo/constants");
    if (!isFsboPubliclyVisible(l)) {
      return NextResponse.json({ error: "Listing not available" }, { status: 404 });
    }
  }

  const intentLevel = scoreMortgageIntentLevel({
    income,
    propertyPrice,
    downPayment,
    timeline,
    preApproved,
  });

  const preApproval = computePreApprovalEstimate({ income, propertyPrice, downPayment });
  const leadValue = computeLeadValueFromIntent(intentLevel);

  const assignment = await assignMortgageBrokerForLead();
  const assignedBrokerId = assignment.brokerId;
  const assignedAt = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const broker = await tx.mortgageBroker.findUnique({
      where: { id: assignedBrokerId },
      select: { email: true },
    });
    if (!broker) throw new Error("Assigned broker not found");

    const row = await tx.mortgageRequest.create({
      data: {
        userId,
        brokerId: assignedBrokerId,
        assignedAt,
        propertyPrice,
        downPayment,
        income,
        status: "pending",
        timeline,
        preApproved,
        intentLevel,
        leadValue,
        estimatedApprovalAmount: preApproval.estimatedApprovalAmount,
        estimatedMonthlyPayment: preApproval.estimatedMonthlyPayment,
        approvalConfidence: preApproval.approvalConfidence,
        fsboListingId: fsboListingId ?? undefined,
        employmentStatus: employmentStatus ?? undefined,
        creditRange: creditRange ?? undefined,
      },
      include: {
        broker: true,
      },
    });

    await tx.mortgageBroker.update({
      where: { id: assignedBrokerId },
      data: { lastAssignedLeadAt: assignedAt },
    });

    await tx.mortgageLeadDistributionLog.create({
      data: {
        mortgageRequestId: row.id,
        brokerId: assignedBrokerId,
        reason: `${assignment.reason}:${assignment.routingReason}`.slice(0, 2000),
        routingScore: assignment.score,
      },
    });

    return { row, notifyEmail: broker.email };
  });

  void syncMortgageReadinessOnRequestSaved({
    mortgageRequestId: created.row.id,
    actorUserId: userId,
  }).catch(() => {});

  void syncMortgageDocumentExtraction({ mortgageRequestId: created.row.id }).catch(() => {});

  void notifyPrimaryBrokerNewMortgageLead({
    brokerEmail: created.notifyEmail,
    leadId: created.row.id,
    propertyPrice: created.row.propertyPrice,
    intentLevel: created.row.intentLevel,
  });

  void recordBuyerGrowthEvent("MORTGAGE_REQUEST", created.row.id, {
    userId,
    fsboListingId: fsboListingId ?? undefined,
  });

  return NextResponse.json({
    id: created.row.id,
    status: created.row.status,
    intentLevel: created.row.intentLevel,
    timeline: created.row.timeline,
    preApproved: created.row.preApproved,
    estimatedApprovalAmount: preApproval.estimatedApprovalAmount,
    estimatedMonthlyPayment: preApproval.estimatedMonthlyPayment,
    approvalConfidence: preApproval.approvalConfidence,
    clientMessage: CLIENT_CONFIRMATION,
    qualificationHint: QUALIFICATION_HINT,
    broker: created.row.broker
      ? {
          id: created.row.broker.id,
          name: created.row.broker.name,
          email: created.row.broker.email,
          phone: created.row.broker.phone,
          company: created.row.broker.company,
          rating: created.row.broker.rating,
          totalReviews: created.row.broker.totalReviews,
          responseTimeAvg: created.row.broker.responseTimeAvg,
          totalLeadsHandled: created.row.broker.totalLeadsHandled,
        }
      : null,
  });
}
