import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@/lib/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canReviewRequiredDocument, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import {
  canTransitionRequiredDocumentStatus,
  getAllowedDocumentStatusTransitions,
} from "@/modules/intake/services/intake-status-machine";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import { notifyDocumentApproved, notifyDocumentRejected } from "@/modules/intake/services/intake-notifications";
import { postIntakeSystemMessageIfConversation } from "@/modules/intake/services/intake-messaging-hook";
import { onRequiredDocumentRejected } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/intake/required-documents/[id]/review
 * Body: { decision: "approve" | "reject", rejectionReason?: string }
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
  if (!bc || !canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canReviewRequiredDocument({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    decision?: string;
    rejectionReason?: string | null;
  } | null;
  const decision = body?.decision?.trim();
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  const next = decision === "approve" ? ("APPROVED" as const) : ("REJECTED" as const);
  if (
    !canTransitionRequiredDocumentStatus(item.status, next, user.role, {
      isBrokerOrAdmin: true,
      isClient: false,
    })
  ) {
    return NextResponse.json(
      { error: "Invalid transition", allowed: getAllowedDocumentStatusTransitions(item.status) },
      { status: 400 }
    );
  }

  const updated = await prisma.requiredDocumentItem.update({
    where: { id: item.id },
    data: {
      status: next,
      reviewedById: user.userId,
      rejectionReason:
        next === "REJECTED"
          ? (body?.rejectionReason?.trim() || "Please upload a clearer or updated document.")
          : null,
    },
  });

  if (next === "APPROVED") {
    await logIntakeEvent({
      type: "DOCUMENT_APPROVED",
      brokerClientId: item.brokerClientId,
      intakeProfileId: item.intakeProfileId,
      requiredDocumentItemId: item.id,
      actorId: user.userId,
      message: item.title,
    });
    notifyDocumentApproved({ brokerClientId: item.brokerClientId, category: item.category });
    void trackDemoEvent(
      DemoEvents.REQUIRED_DOCUMENT_APPROVED,
      { category: item.category },
      user.userId
    );
  } else {
    await logIntakeEvent({
      type: "DOCUMENT_REJECTED",
      brokerClientId: item.brokerClientId,
      intakeProfileId: item.intakeProfileId,
      requiredDocumentItemId: item.id,
      actorId: user.userId,
      message: updated.rejectionReason ?? undefined,
    });
    notifyDocumentRejected({ brokerClientId: item.brokerClientId, category: item.category });
    void trackDemoEvent(
      DemoEvents.REQUIRED_DOCUMENT_REJECTED,
      { category: item.category },
      user.userId
    );
    void postIntakeSystemMessageIfConversation({
      brokerClientId: item.brokerClientId,
      body: `A document was rejected (${item.title}). Please re-upload when ready.`,
    });
    void onRequiredDocumentRejected({
      clientUserId: bc.userId,
      brokerClientId: item.brokerClientId,
      requiredDocumentItemId: item.id,
      title: updated.rejectionReason ?? item.title,
    });
  }

  return NextResponse.json({ item: updated });
}
