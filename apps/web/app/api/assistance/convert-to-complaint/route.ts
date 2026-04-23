import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  applyMandatoryComplaintRules,
  assertComplaintRoutingPresent,
  suggestComplaintRouting,
} from "@/lib/compliance/complaints";
import { buildComplaintCaseNumber, COMPLAINT_PLATFORM_OWNER_ID } from "@/lib/compliance/complaint-case-number";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceAction } from "@/lib/compliance/enforce-action";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    actorId: userId,
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const assistanceRequestId = typeof body.assistanceRequestId === "string" ? body.assistanceRequestId.trim() : "";
  if (!assistanceRequestId) {
    return NextResponse.json({ success: false, error: "ASSISTANCE_REQUEST_ID_REQUIRED" }, { status: 400 });
  }

  try {
    await enforceAction({
      ownerType: "solo_broker",
      ownerId: userId,
      actorId: userId,
      actionKey: "complaint_convert",
      entityType: "assistance_request",
      entityId: assistanceRequestId,
      moduleKey: "complaints",
      facts: { assistanceRequestId },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ACTION_BLOCKED";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }

  try {
    const complaint = await prisma.$transaction(async (tx) => {
      const ar = await tx.assistanceRequest.findUnique({ where: { id: assistanceRequestId } });
      if (!ar) {
        throw new Error("NOT_FOUND");
      }
      if (ar.threadLocked || ar.status === "converted_to_complaint") {
        throw new Error("ASSISTANCE_THREAD_LOCKED");
      }

      const complaintType = ar.topic === "deposit" ? "trust_money_issue" : "other";
      const mentionsTrustMoney = ar.topic === "deposit" || complaintType === "trust_money_issue";
      let severity = "low";
      let routingDecision = suggestComplaintRouting({
        complaintType,
        severity,
        mentionsFraud: false,
        mentionsTrustMoney,
      });
      const applied = applyMandatoryComplaintRules({ complaintType, severity, routingDecision });
      severity = applied.severity;
      routingDecision = applied.routingDecision;
      assertComplaintRoutingPresent(routingDecision);

      const summary = ar.message.length > 200 ? `${ar.message.slice(0, 197)}…` : ar.message;

      const complaint = await tx.complaintCase.create({
        data: {
          caseNumber: buildComplaintCaseNumber(),
          ownerType: "platform",
          ownerId: COMPLAINT_PLATFORM_OWNER_ID,
          complainantUserId: ar.userId,
          complainantName: ar.name,
          complainantEmail: ar.email,
          complainantPhone: ar.phone,
          targetType: "unknown",
          targetId: null,
          linkedBrokerId: ar.relatedBrokerId,
          linkedListingId: ar.relatedListingId,
          linkedDealId: ar.relatedDealId,
          complaintChannel: "public_form",
          complaintType,
          severity,
          summary,
          description: ar.message,
          intakeLanguage: ar.language,
          status: "new",
          routingDecision,
          aiFlags: {
            ...applied.intakeFlags,
            fromAssistanceRequestId: ar.id,
            fromAssistanceRequestNumber: ar.requestNumber,
          },
        },
      });

      await tx.complaintEvent.create({
        data: {
          complaintCaseId: complaint.id,
          eventType: "created",
          performedById: userId,
          visibleToComplainant: true,
          details: {
            caseNumber: complaint.caseNumber,
            assistanceRequestId: ar.id,
            source: "assistance_conversion",
          },
        },
      });

      await tx.assistanceRequest.update({
        where: { id: assistanceRequestId },
        data: {
          status: "converted_to_complaint",
          threadLocked: true,
          linkedComplaintCaseId: complaint.id,
        },
      });

      await tx.assistanceMessage.create({
        data: {
          assistanceRequestId: ar.id,
          senderType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
          senderId: userId,
          isOfficial: true,
          message: `Converted to complaint case ${complaint.caseNumber} (${complaint.id}). Thread locked for intake.`,
        },
      });

      return complaint;
    });

    logComplianceEvent("ASSISTANCE_CONVERTED_TO_COMPLAINT", {
      assistanceRequestId,
      complaintCaseId: complaint.id,
      performedById: userId,
    });

    await logAuditEvent({
      ownerType: "platform",
      ownerId: COMPLAINT_PLATFORM_OWNER_ID,
      entityType: "assistance_request",
      entityId: assistanceRequestId,
      actionType: "converted_to_complaint",
      moduleKey: "assistance",
      actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
      actorId: userId,
      linkedComplaintCaseId: complaint.id,
      severity: "info",
      summary: "Assistance request converted to complaint case",
      details: { complaintCaseId: complaint.id, caseNumber: complaint.caseNumber },
    });
    await logAuditEvent({
      ownerType: complaint.ownerType,
      ownerId: complaint.ownerId,
      entityType: "complaint",
      entityId: complaint.id,
      actionType: "created",
      moduleKey: "complaints",
      actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
      actorId: userId,
      linkedComplaintCaseId: complaint.id,
      linkedListingId: complaint.linkedListingId,
      linkedDealId: complaint.linkedDealId,
      severity: "info",
      summary: "Complaint created from assistance conversion",
      details: { fromAssistanceRequestId: assistanceRequestId },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (msg === "ASSISTANCE_THREAD_LOCKED") {
      return NextResponse.json({ success: false, error: "ASSISTANCE_THREAD_LOCKED" }, { status: 400 });
    }
    console.error("[assistance/convert-to-complaint]", e);
    return NextResponse.json({ success: false, error: "CONVERSION_FAILED" }, { status: 500 });
  }
}
