import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  applyMandatoryComplaintRules,
  assertComplaintRoutingPresent,
  classifyComplaintSeverity,
  suggestComplaintRouting,
} from "@/lib/compliance/complaints";
import { buildComplaintCaseNumber, COMPLAINT_PLATFORM_OWNER_ID } from "@/lib/compliance/complaint-case-number";
import { sessionOwnsFinancialOwner } from "@/lib/compliance/financial-route-guard";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { createComplianceAlert } from "@/lib/compliance/alerts";

export const dynamic = "force-dynamic";

function mergeAiFlags(
  intake: Record<string, boolean>,
  bodyFlags: unknown
): Record<string, unknown> {
  const base: Record<string, unknown> = { ...intake };
  if (bodyFlags && typeof bodyFlags === "object" && !Array.isArray(bodyFlags)) {
    Object.assign(base, bodyFlags as Record<string, unknown>);
  }
  return base;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const complaintChannel = typeof body.complaintChannel === "string" ? body.complaintChannel : "public_form";
  const complaintType = typeof body.complaintType === "string" ? body.complaintType : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const complainantEmail = typeof body.complainantEmail === "string" ? body.complainantEmail.trim() : "";

  if (!complaintType || !summary || !description) {
    return NextResponse.json({ success: false, error: "MISSING_REQUIRED_FIELDS" }, { status: 400 });
  }

  const sessionUserId = await getGuestId();
  const user = sessionUserId
    ? await prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } })
    : null;

  const isPublicAnonymous = complaintChannel === "public_form" && !sessionUserId;
  if (isPublicAnonymous && !complainantEmail) {
    return NextResponse.json({ success: false, error: "COMPLAINANT_EMAIL_REQUIRED" }, { status: 400 });
  }

  if (!isPublicAnonymous) {
    if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  let ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;

  if (isPublicAnonymous) {
    ownerType = "platform";
    ownerId = COMPLAINT_PLATFORM_OWNER_ID;
  } else if (user!.role === PlatformRole.ADMIN) {
    if (!ownerType || !ownerId) {
      return NextResponse.json({ success: false, error: "OWNER_REQUIRED" }, { status: 400 });
    }
  } else {
    if (agencyId) {
      ownerType = "agency";
      ownerId = agencyId;
    } else {
      ownerType = "solo_broker";
      ownerId = sessionUserId!;
    }
    if (!sessionOwnsFinancialOwner(ownerType, ownerId, { userId: sessionUserId!, role: user!.role }, { agencyId })) {
      return NextResponse.json({ success: false, error: "OWNER_FORBIDDEN" }, { status: 403 });
    }
  }

  const insp = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType,
    ownerId,
    actorId: sessionUserId ?? COMPLAINT_PLATFORM_OWNER_ID,
    actorType: !sessionUserId
      ? "anonymous"
      : user?.role === PlatformRole.ADMIN
        ? "admin"
        : "broker",
  });
  if (insp) return insp;

  const mentionsTrustMoney = !!body.mentionsTrustMoney;
  const mentionsFraud = !!body.mentionsFraud;
  const repeatedPattern = !!body.repeatedPattern;

  let severity =
    typeof body.severity === "string" && body.severity.trim()
      ? body.severity.trim()
      : classifyComplaintSeverity({
          complaintType,
          mentionsTrustMoney,
          mentionsFraud,
          repeatedPattern,
        });

  let routingDecision =
    typeof body.routingDecision === "string" && body.routingDecision.trim()
      ? body.routingDecision.trim()
      : suggestComplaintRouting({
          complaintType,
          severity,
          mentionsFraud,
          mentionsTrustMoney,
        });

  const applied = applyMandatoryComplaintRules({ complaintType, severity, routingDecision });
  severity = applied.severity;
  routingDecision = applied.routingDecision;

  try {
    assertComplaintRoutingPresent(routingDecision);
  } catch {
    return NextResponse.json({ success: false, error: "COMPLAINT_ROUTING_DECISION_REQUIRED" }, { status: 400 });
  }

  const performedById = sessionUserId ?? null;
  const aiFlags = mergeAiFlags(applied.intakeFlags, body.aiFlags);

  const complaint = await prisma.complaintCase.create({
    data: {
      caseNumber: buildComplaintCaseNumber(),
      ownerType,
      ownerId,
      complainantUserId: sessionUserId ?? (typeof body.complainantUserId === "string" ? body.complainantUserId : null),
      complainantName: typeof body.complainantName === "string" ? body.complainantName : null,
      complainantEmail: complainantEmail || null,
      complainantPhone: typeof body.complainantPhone === "string" ? body.complainantPhone : null,
      targetType: typeof body.targetType === "string" ? body.targetType : "unknown",
      targetId: typeof body.targetId === "string" ? body.targetId : null,
      linkedBrokerId: typeof body.linkedBrokerId === "string" ? body.linkedBrokerId : null,
      linkedAgencyId: typeof body.linkedAgencyId === "string" ? body.linkedAgencyId : agencyId,
      linkedListingId: typeof body.linkedListingId === "string" ? body.linkedListingId : null,
      linkedDealId: typeof body.linkedDealId === "string" ? body.linkedDealId : null,
      linkedOfferId: typeof body.linkedOfferId === "string" ? body.linkedOfferId : null,
      linkedContractId: typeof body.linkedContractId === "string" ? body.linkedContractId : null,
      complaintChannel,
      complaintType,
      severity,
      summary,
      description,
      intakeLanguage: typeof body.intakeLanguage === "string" ? body.intakeLanguage : "en",
      status: "new",
      routingDecision,
      aiSummary: typeof body.aiSummary === "string" ? body.aiSummary : null,
      aiFlags,
    },
  });

  await prisma.complaintEvent.create({
    data: {
      complaintCaseId: complaint.id,
      eventType: "created",
      performedById,
      visibleToComplainant: true,
      details: {
        caseNumber: complaint.caseNumber,
        complaintType: complaint.complaintType,
        severity,
        routingDecision,
      },
    },
  });

  if (severity === "critical") {
    await createComplianceAlert({
      ownerType,
      ownerId,
      alertType: "complaint",
      severity: "high",
      title: "Critical complaint",
      description: summary,
      entityType: "complaint_case",
      entityId: complaint.id,
    });
  }

  logComplianceEvent("COMPLAINT_CASE_CREATED", {
    complaintCaseId: complaint.id,
    caseNumber: complaint.caseNumber,
    ownerType,
    ownerId,
    routingDecision,
  });

  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "complaint",
    entityId: complaint.id,
    actionType: "created",
    moduleKey: "complaints",
    actorType: !sessionUserId
      ? "anonymous"
      : user?.role === PlatformRole.ADMIN
        ? "admin"
        : "broker",
    actorId: sessionUserId,
    linkedComplaintCaseId: complaint.id,
    linkedListingId: complaint.linkedListingId,
    linkedDealId: complaint.linkedDealId,
    linkedOfferId: complaint.linkedOfferId,
    linkedContractId: complaint.linkedContractId,
    severity: severity === "high" || severity === "critical" ? "high" : "info",
    summary: "Complaint case created",
    details: {
      caseNumber: complaint.caseNumber,
      complaintType: complaint.complaintType,
      routingDecision,
      channel: complaintChannel,
    },
  });

  return NextResponse.json({ success: true, complaint });
}
