import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { validateComplaintClosure } from "@/lib/compliance/complaints";
import { complaintCaseVisibleToSession } from "@/lib/compliance/complaint-access";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const complaintCaseId = typeof body.complaintCaseId === "string" ? body.complaintCaseId.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const routingDecision =
    typeof body.routingDecision === "string" && body.routingDecision.trim()
      ? body.routingDecision.trim()
      : undefined;
  const note = typeof body.note === "string" ? body.note : null;
  const reviewerAcknowledged = body.reviewerAcknowledged === true;
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;

  if (!complaintCaseId || !status) {
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

  const nextRouting = routingDecision ?? existing.routingDecision ?? undefined;

  if (status === "closed" || status === "resolved_internal") {
    const closure = validateComplaintClosure({
      status,
      routingDecision: nextRouting,
      reviewerAcknowledged,
    });
    if (!closure.allowed) {
      return NextResponse.json({ success: false, error: closure.reason }, { status: 400 });
    }

    const guard = await enforceComplianceAction({
      ownerType: existing.ownerType,
      ownerId: existing.ownerId,
      moduleKey: "complaints",
      actionKey: "close_complaint",
      entityType: "complaint",
      entityId: complaintCaseId,
      actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
      actorId: userId,
      facts: {
        routingDecision: nextRouting ?? null,
        humanReviewRequired: existing.severity === "high" || existing.severity === "critical",
        humanReviewCompleted: reviewerAcknowledged === true || status === "resolved_internal",
      },
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.reasonCode ?? "COMPLAINT_CLOSURE_BLOCKED", message: guard.message },
        { status: 403 },
      );
    }
  }

  const data: {
    status: string;
    routingDecision?: string;
    acknowledgedAt?: Date;
    closedAt?: Date;
  } = { status };

  if (routingDecision !== undefined) {
    data.routingDecision = routingDecision;
  }
  if (status === "triaged" || status === "in_review") {
    data.acknowledgedAt = new Date();
  }
  if (status === "closed" || status === "resolved_internal") {
    data.closedAt = new Date();
  }

  const complaint = await prisma.complaintCase.update({
    where: { id: complaintCaseId },
    data,
  });

  await prisma.complaintEvent.create({
    data: {
      complaintCaseId,
      eventType: "status_changed",
      performedById: userId,
      visibleToComplainant: ["triaged", "waiting_info", "resolved_internal", "closed"].includes(status),
      details: {
        status,
        routingDecision: nextRouting ?? null,
        note,
        reviewerAcknowledged: reviewerAcknowledged || null,
      },
    },
  });

  logComplianceEvent("COMPLAINT_STATUS_UPDATED", {
    complaintCaseId,
    status,
    performedById: userId,
  });

  let actionType = "status_changed";
  if (status === "closed" || status === "resolved_internal") {
    actionType = "complaint_closed";
  } else if (
    routingDecision !== undefined &&
    routingDecision !== (existing.routingDecision ?? undefined)
  ) {
    actionType = "routed";
  }

  await logAuditEvent({
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    entityType: "complaint",
    entityId: complaint.id,
    actionType,
    moduleKey: "complaints",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: userId,
    linkedComplaintCaseId: complaint.id,
    linkedListingId: existing.linkedListingId,
    severity: actionType === "complaint_closed" ? "info" : "info",
    summary: `Complaint ${actionType.replace(/_/g, " ")}`,
    details: { status, routingDecision: nextRouting ?? null, note },
  });

  return NextResponse.json({ success: true, complaint });
}
