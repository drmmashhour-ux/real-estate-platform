import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@/lib/db";
import { canViewDocument, type UserForDocuments } from "@/modules/documents/services/document-permissions";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canUploadForRequiredDocument, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import {
  canTransitionRequiredDocumentStatus,
  getAllowedDocumentStatusTransitions,
} from "@/modules/intake/services/intake-status-machine";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import { onRequiredDocumentUploaded } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/intake/required-documents/[id]/upload-link
 * Body: { documentFileId: string, underReview?: boolean }
 */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const item = await prisma.requiredDocumentItem.findFirst({
    where: { id, deletedAt: null },
  });
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
  if (!canUploadForRequiredDocument({ id: user.userId, role: user.role }, bc, item)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isBrokerOrAdmin = user.role === "ADMIN" || bc.brokerId === user.userId;
  const isClient = bc.userId === user.userId;

  const body = (await request.json().catch(() => null)) as {
    documentFileId?: string;
    underReview?: boolean;
  } | null;
  const documentFileId = body?.documentFileId?.trim();
  if (!documentFileId) {
    return NextResponse.json({ error: "documentFileId required" }, { status: 400 });
  }

  const file = await prisma.documentFile.findFirst({
    where: { id: documentFileId, status: { not: "DELETED" } },
  });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (file.brokerClientId !== item.brokerClientId) {
    return NextResponse.json(
      { error: "File must belong to this client workspace" },
      { status: 400 }
    );
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canViewDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wantReview = Boolean(body?.underReview) && isBrokerOrAdmin;
  let current = item.status;

  const tryTransition = (next: typeof current) =>
    canTransitionRequiredDocumentStatus(current, next, user.role, {
      isBrokerOrAdmin,
      isClient,
    });

  if (!tryTransition("UPLOADED")) {
    return NextResponse.json(
      {
        error: "Invalid transition",
        current,
        allowed: getAllowedDocumentStatusTransitions(current),
      },
      { status: 400 }
    );

  }

  let updated = await prisma.requiredDocumentItem.update({
    where: { id: item.id },
    data: {
      linkedDocumentFileId: documentFileId,
      status: "UPLOADED",
      rejectionReason: null,
    },
  });
  current = "UPLOADED";

  if (wantReview && tryTransition("UNDER_REVIEW")) {
    updated = await prisma.requiredDocumentItem.update({
      where: { id: item.id },
      data: { status: "UNDER_REVIEW" },
    });
  }

  await logIntakeEvent({
    type: "DOCUMENT_LINKED",
    brokerClientId: item.brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: `Linked file ${documentFileId}`,
    metadata: { documentFileId },
  });

  await logIntakeEvent({
    type: "DOCUMENT_UPLOADED",
    brokerClientId: item.brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: item.title,
  });

  void trackDemoEvent(
    DemoEvents.REQUIRED_DOCUMENT_UPLOADED,
    { category: item.category },
    user.userId
  );

  if (isClient) {
    void onRequiredDocumentUploaded({
      brokerUserId: bc.brokerId,
      brokerClientId: item.brokerClientId,
      requiredDocumentItemId: item.id,
      title: item.title,
    });
  }

  return NextResponse.json({ item: updated });
}
