import { NextRequest, NextResponse } from "next/server";
import type { RequiredDocumentCategory, RequiredDocumentStatus } from "@prisma/client";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@/lib/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import {
  canManageRequiredDocuments,
  canReviewRequiredDocument,
  canViewIntakeProfile,
} from "@/modules/intake/services/intake-permissions";
import {
  canTransitionRequiredDocumentStatus,
  getAllowedDocumentStatusTransitions,
} from "@/modules/intake/services/intake-status-machine";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

const CATEGORIES = new Set<string>([
  "IDENTITY",
  "INCOME",
  "BANKING",
  "TAX",
  "RESIDENCY",
  "CREDIT",
  "EMPLOYMENT",
  "CORPORATE",
  "PROPERTY",
  "OTHER",
]);

async function loadItem(id: string) {
  return prisma.requiredDocumentItem.findFirst({
    where: { id, deletedAt: null },
    include: { brokerClient: true },
  });
}

/**
 * PATCH /api/intake/required-documents/[id]
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const item = await loadItem(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bc = await getBrokerClientForIntake(item.brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBrokerOrAdmin =
    user.role === "ADMIN" || bc.brokerId === user.userId;
  const isClient = bc.userId === user.userId;

  const data: Record<string, unknown> = {};

  if ("title" in body && isBrokerOrAdmin) {
    data.title = String(body.title ?? "").trim() || item.title;
  }
  if ("description" in body && isBrokerOrAdmin) {
    const v = body.description;
    data.description = v === null || v === undefined ? null : String(v);
  }
  if ("dueAt" in body && isBrokerOrAdmin) {
    const v = body.dueAt;
    if (v === null || v === undefined || v === "") data.dueAt = null;
    else {
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid dueAt" }, { status: 400 });
      }
      data.dueAt = d;
    }
  }
  if ("isMandatory" in body && isBrokerOrAdmin) {
    data.isMandatory = Boolean(body.isMandatory);
  }
  if ("notes" in body && isBrokerOrAdmin) {
    const v = body.notes;
    data.notes = v === null || v === undefined ? null : String(v);
  }
  if ("rejectionReason" in body && isBrokerOrAdmin) {
    const v = body.rejectionReason;
    data.rejectionReason = v === null || v === undefined ? null : String(v);
  }
  if ("category" in body && isBrokerOrAdmin) {
    const c = String(body.category ?? "").trim();
    if (!CATEGORIES.has(c)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = c as RequiredDocumentCategory;
  }

  if ("linkedDocumentFileId" in body && isBrokerOrAdmin) {
    const v = body.linkedDocumentFileId;
    data.linkedDocumentFileId = v === null || v === undefined || v === "" ? null : String(v);
  }

  if ("status" in body) {
    const next = String(body.status ?? "").trim() as RequiredDocumentStatus;
    const current = item.status;
    const allowed = canTransitionRequiredDocumentStatus(current, next, user.role, {
      isBrokerOrAdmin,
      isClient,
    });
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Invalid transition",
          current,
          next,
          allowed: getAllowedDocumentStatusTransitions(current),
        },
        { status: 400 }
      );
    }
    if (next === "APPROVED" || next === "REJECTED" || next === "WAIVED") {
      if (!canReviewRequiredDocument({ id: user.userId, role: user.role }, bc)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    data.status = next;
    if (next === "APPROVED" || next === "REJECTED" || next === "UNDER_REVIEW") {
      data.reviewedById = user.userId;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.requiredDocumentItem.update({
    where: { id: item.id },
    data: data as object,
  });

  if ("status" in data && typeof data.status === "string") {
    const st = data.status;
    const evt =
      st === "APPROVED"
        ? ("DOCUMENT_APPROVED" as const)
        : st === "REJECTED"
          ? ("DOCUMENT_REJECTED" as const)
          : st === "WAIVED"
            ? ("DOCUMENT_WAIVED" as const)
            : ("NOTE_ADDED" as const);
    await logIntakeEvent({
      type: evt,
      brokerClientId: item.brokerClientId,
      intakeProfileId: item.intakeProfileId,
      requiredDocumentItemId: item.id,
      actorId: user.userId,
      message: `Status → ${st}`,
    });
    if (data.status === "APPROVED") {
      void trackDemoEvent(
        DemoEvents.REQUIRED_DOCUMENT_APPROVED,
        { category: updated.category },
        user.userId
      );
    }
    if (data.status === "REJECTED") {
      void trackDemoEvent(
        DemoEvents.REQUIRED_DOCUMENT_REJECTED,
        { category: updated.category },
        user.userId
      );
    }
  } else {
    await logIntakeEvent({
      type: "NOTE_ADDED",
      brokerClientId: item.brokerClientId,
      intakeProfileId: item.intakeProfileId,
      requiredDocumentItemId: item.id,
      actorId: user.userId,
      message: "Requirement updated",
      metadata: { fields: Object.keys(data) },
    });
  }

  return NextResponse.json({ item: updated });
}

/**
 * DELETE /api/intake/required-documents/[id] — broker/admin soft delete.
 */
export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const item = await loadItem(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bc = await getBrokerClientForIntake(item.brokerClientId);
  if (!bc || !canManageRequiredDocuments({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.requiredDocumentItem.update({
    where: { id: item.id },
    data: { deletedAt: new Date() },
  });

  await logIntakeEvent({
    type: "NOTE_ADDED",
    brokerClientId: item.brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: "Requirement removed from active checklist",
  });

  return NextResponse.json({ ok: true });
}
