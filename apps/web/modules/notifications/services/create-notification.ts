import type {
  Notification,
  NotificationPriority,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { findRecentUnreadNotificationDuplicate } from "@/modules/notifications/services/notification-dedupe";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  actionLabel?: string | null;
  actorId?: string | null;
  tenantId?: string | null;
  listingId?: string | null;
  brokerClientId?: string | null;
  intakeProfileId?: string | null;
  requiredDocumentItemId?: string | null;
  offerId?: string | null;
  contractId?: string | null;
  appointmentId?: string | null;
  conversationId?: string | null;
  documentFileId?: string | null;
  metadata?: Prisma.InputJsonValue;
  /** When true, skip if an unread duplicate exists for same anchors (see dedupe helper). */
  skipIfDuplicateUnread?: boolean;
};

async function logNotificationEvent(params: {
  notificationId: string;
  actorId?: string | null;
  type: "CREATED" | "READ" | "ARCHIVED";
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.notificationEvent.create({
    data: {
      notificationId: params.notificationId,
      type: params.type,
      actorId: params.actorId ?? undefined,
      message: params.message ?? undefined,
      metadata: params.metadata === undefined ? undefined : (params.metadata as object),
    },
  });
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification | null> {
  if (input.skipIfDuplicateUnread) {
    const dup = await findRecentUnreadNotificationDuplicate({
      userId: input.userId,
      type: input.type,
      offerId: input.offerId,
      conversationId: input.conversationId,
      requiredDocumentItemId: input.requiredDocumentItemId,
      contractId: input.contractId,
      appointmentId: input.appointmentId,
    });
    if (dup) return null;
  }

  const n = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? undefined,
      priority: input.priority ?? "NORMAL",
      actionUrl: input.actionUrl ?? undefined,
      actionLabel: input.actionLabel ?? undefined,
      actorId: input.actorId ?? undefined,
      tenantId: input.tenantId ?? undefined,
      listingId: input.listingId ?? undefined,
      brokerClientId: input.brokerClientId ?? undefined,
      intakeProfileId: input.intakeProfileId ?? undefined,
      requiredDocumentItemId: input.requiredDocumentItemId ?? undefined,
      offerId: input.offerId ?? undefined,
      contractId: input.contractId ?? undefined,
      appointmentId: input.appointmentId ?? undefined,
      conversationId: input.conversationId ?? undefined,
      documentFileId: input.documentFileId ?? undefined,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object),
    },
  });

  await logNotificationEvent({
    notificationId: n.id,
    actorId: input.actorId,
    type: "CREATED",
    message: input.title,
  });

  void trackDemoEvent(
    DemoEvents.NOTIFICATION_CREATED,
    { type: n.type, priority: n.priority },
    input.userId
  );

  return n;
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
): Promise<number> {
  let n = 0;
  for (const userId of userIds) {
    const created = await createNotification({ ...input, userId });
    if (created) n += 1;
  }
  return n;
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
  actorId?: string | null
): Promise<Notification | null> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!existing) return null;
  if (existing.status !== "UNREAD") return existing;

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  await logNotificationEvent({
    notificationId,
    actorId: actorId ?? userId,
    type: "READ",
  });

  void trackDemoEvent(DemoEvents.NOTIFICATION_READ, { type: updated.type }, userId);

  return updated;
}

export async function archiveNotification(
  notificationId: string,
  userId: string,
  actorId?: string | null
): Promise<Notification | null> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!existing) return null;

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  await logNotificationEvent({
    notificationId,
    actorId: actorId ?? userId,
    type: "ARCHIVED",
  });

  return updated;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await prisma.notification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ", readAt: new Date() },
  });
  if (res.count > 0) {
    await prisma.notificationEvent.create({
      data: {
        type: "READ",
        actorId: userId,
        message: `Marked ${res.count} notification(s) as read`,
      },
    });
  }
  return res.count;
}
