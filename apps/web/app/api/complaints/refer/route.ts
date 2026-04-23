import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { complaintCaseVisibleToSession } from "@/lib/compliance/complaint-access";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

export const dynamic = "force-dynamic";

function referralEventType(referralType: string): string {
  if (referralType === "public_assistance") return "public_assistance_referred";
  if (referralType === "syndic_candidate") return "syndic_candidate_flagged";
  return "routed";
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const complaintCaseId = typeof body.complaintCaseId === "string" ? body.complaintCaseId.trim() : "";
  const referralType = typeof body.referralType === "string" ? body.referralType.trim() : "";
  const referralReason = typeof body.referralReason === "string" ? body.referralReason.trim() : "";
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;

  if (!complaintCaseId || !referralType || !referralReason) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const existing = await prisma.complaintCase.findUnique({ where: { id: complaintCaseId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }
  if (!complaintCaseVisibleToSession(existing, { userId, role: user.role }, { agencyId })) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    actorId: userId,
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const compliance = await enforceComplianceAction({
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    moduleKey: "complaints",
    actionKey: "refer_complaint",
    entityType: "complaint",
    entityId: complaintCaseId,
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: userId,
    facts: {
      routingDecisionPresent: Boolean(existing.routingDecision?.trim()),
    },
  });
  if (!compliance.allowed) {
    return NextResponse.json(
      { success: false, error: compliance.reasonCode ?? "COMPLAINT_REFERRAL_BLOCKED", message: compliance.message },
      { status: 403 },
    );
  }

  const referral = await prisma.publicProtectionReferral.upsert({
    where: { complaintCaseId },
    update: {
      referralType,
      referralReason,
      referralStatus: "sent",
      referredById: userId,
    },
    create: {
      complaintCaseId,
      referralType,
      referralReason,
      referralStatus: "sent",
      referredById: userId,
    },
  });

  const status =
    referralType === "public_assistance"
      ? "escalated_public_assistance"
      : referralType === "syndic_candidate"
        ? "escalated_syndic_review"
        : "escalated_compliance";

  const routingDecision =
    referralType === "public_assistance"
      ? "public_assistance"
      : referralType === "syndic_candidate"
        ? "syndic_candidate"
        : "compliance_review";

  await prisma.complaintCase.update({
    where: { id: complaintCaseId },
    data: {
      status,
      routingDecision,
    },
  });

  await prisma.complaintEvent.create({
    data: {
      complaintCaseId,
      eventType: referralEventType(referralType),
      performedById: userId,
      visibleToComplainant: false,
      details: {
        referralType,
        referralReason,
      },
    },
  });

  logComplianceEvent("COMPLAINT_REFERRAL_RECORDED", {
    complaintCaseId,
    referralType,
    performedById: userId,
  });

  await logAuditEvent({
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    entityType: "complaint",
    entityId: complaintCaseId,
    actionType: "referred",
    moduleKey: "complaints",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: userId,
    linkedComplaintCaseId: complaintCaseId,
    severity: referralType === "syndic_candidate" ? "high" : "info",
    summary: "Complaint referred for external / oversight handling",
    details: { referralType, referralReason, routingDecision },
  });

  return NextResponse.json({ success: true, referral });
}
