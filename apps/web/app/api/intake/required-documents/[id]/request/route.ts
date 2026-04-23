import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@repo/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canManageRequiredDocuments, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import {
  canTransitionRequiredDocumentStatus,
  getAllowedDocumentStatusTransitions,
} from "@/modules/intake/services/intake-status-machine";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import { notifyRequiredDocumentRequested } from "@/modules/intake/services/intake-notifications";
import { postIntakeSystemMessageIfConversation } from "@/modules/intake/services/intake-messaging-hook";
import { onRequiredDocumentRequested } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/intake/required-documents/[id]/request — mark REQUESTED (broker/admin).
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
  if (!canManageRequiredDocuments({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const next = "REQUESTED" as const;
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
      requestedById: user.userId,
    },
  });

  await logIntakeEvent({
    type: "DOCUMENT_REQUESTED",
    brokerClientId: item.brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: "Document requested from client",
  });

  notifyRequiredDocumentRequested({ brokerClientId: item.brokerClientId, category: item.category });
  void trackDemoEvent(
    DemoEvents.REQUIRED_DOCUMENT_REQUESTED,
    { category: item.category },
    user.userId
  );

  void postIntakeSystemMessageIfConversation({
    brokerClientId: item.brokerClientId,
    body: `New document requested: ${item.title}.`,
  });

  void onRequiredDocumentRequested({
    clientUserId: bc.userId,
    brokerClientId: item.brokerClientId,
    requiredDocumentItemId: item.id,
    title: item.title,
  });

  return NextResponse.json({ item: updated });
}
