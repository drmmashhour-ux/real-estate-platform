import type { ActionQueueItemType, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findOpenActionQueueDuplicate(params: {
  userId: string;
  type: ActionQueueItemType;
  sourceType: string | null;
  sourceId: string | null;
}): Promise<{ id: string } | null> {
  const row = await prisma.actionQueueItem.findFirst({
    where: {
      userId: params.userId,
      type: params.type,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
  return row;
}

/**
 * Skip spamming identical unread notifications for the same workflow anchor.
 */
export async function findRecentUnreadNotificationDuplicate(params: {
  userId: string;
  type: NotificationType;
  offerId?: string | null;
  conversationId?: string | null;
  requiredDocumentItemId?: string | null;
  contractId?: string | null;
  appointmentId?: string | null;
  withinHours?: number;
}): Promise<{ id: string } | null> {
  const since = new Date(Date.now() - (params.withinHours ?? 6) * 3600 * 1000);
  const where: Prisma.NotificationWhereInput = {
    userId: params.userId,
    type: params.type,
    status: "UNREAD",
    createdAt: { gte: since },
  };
  if (params.offerId != null) where.offerId = params.offerId;
  if (params.conversationId != null) where.conversationId = params.conversationId;
  if (params.requiredDocumentItemId != null) where.requiredDocumentItemId = params.requiredDocumentItemId;
  if (params.contractId != null) where.contractId = params.contractId;
  if (params.appointmentId != null) where.appointmentId = params.appointmentId;

  const row = await prisma.notification.findFirst({
    where,
    select: { id: true },
  });
  return row;
}
