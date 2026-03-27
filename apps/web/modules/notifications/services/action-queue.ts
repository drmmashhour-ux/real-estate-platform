import type {
  ActionQueueItem,
  ActionQueueItemStatus,
  ActionQueueItemType,
  NotificationPriority,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { findOpenActionQueueDuplicate } from "@/modules/notifications/services/notification-dedupe";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";

export type CreateActionQueueInput = {
  userId: string;
  type: ActionQueueItemType;
  title: string;
  description?: string | null;
  priority?: NotificationPriority;
  dueAt?: Date | null;
  sourceKey?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  actionUrl?: string | null;
  metadata?: Prisma.InputJsonValue;
  tenantId?: string | null;
  /** Skip when an open item already exists for the same source. */
  skipIfDuplicateSource?: boolean;
};

async function logQueueEvent(params: {
  actionQueueItemId: string;
  actorId?: string | null;
  type: "CREATED" | "ACTION_COMPLETED" | "ACTION_DISMISSED" | "STATUS_CHANGED";
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.notificationEvent.create({
    data: {
      actionQueueItemId: params.actionQueueItemId,
      type: params.type,
      actorId: params.actorId ?? undefined,
      message: params.message ?? undefined,
      metadata: params.metadata === undefined ? undefined : (params.metadata as object),
    },
  });
}

export async function createActionQueueItem(input: CreateActionQueueInput): Promise<ActionQueueItem | null> {
  if (input.skipIfDuplicateSource !== false) {
    const dup = await findOpenActionQueueDuplicate({
      userId: input.userId,
      type: input.type,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
    });
    if (dup) return null;
  }

  const row = await prisma.actionQueueItem.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description ?? undefined,
      priority: input.priority ?? "NORMAL",
      dueAt: input.dueAt ?? undefined,
      sourceKey: input.sourceKey ?? undefined,
      sourceType: input.sourceType ?? undefined,
      sourceId: input.sourceId ?? undefined,
      actionUrl: input.actionUrl ?? undefined,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object),
      tenantId: input.tenantId ?? undefined,
    },
  });

  await logQueueEvent({
    actionQueueItemId: row.id,
    type: "CREATED",
    message: input.title,
  });

  return row;
}

export type ActionQueueFilter = {
  status?: ActionQueueItemStatus | ActionQueueItemStatus[];
  priority?: NotificationPriority;
  type?: ActionQueueItemType;
  dueToday?: boolean;
  overdue?: boolean;
  openOnly?: boolean;
};

export async function getUserActionQueue(
  userId: string,
  opts: { take?: number; skip?: number; filter?: ActionQueueFilter } = {}
): Promise<ActionQueueItem[]> {
  const take = Math.min(opts.take ?? 50, 100);
  const skip = opts.skip ?? 0;
  const f = opts.filter;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const where: Prisma.ActionQueueItemWhereInput = { userId };

  if (f?.openOnly !== false) {
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  } else if (f?.status) {
    where.status = Array.isArray(f.status) ? { in: f.status } : f.status;
  }

  if (f?.priority) where.priority = f.priority;
  if (f?.type) where.type = f.type;

  if (f?.overdue) {
    where.dueAt = { lt: now };
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  } else if (f?.dueToday) {
    where.dueAt = { gte: startOfDay, lt: endOfDay };
  }

  return prisma.actionQueueItem.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take,
    skip,
  });
}

export async function completeActionQueueItem(
  id: string,
  userId: string,
  actorId?: string | null
): Promise<ActionQueueItem | null> {
  const row = await prisma.actionQueueItem.findFirst({ where: { id, userId } });
  if (!row) return null;

  const updated = await prisma.actionQueueItem.update({
    where: { id },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });

  await logQueueEvent({
    actionQueueItemId: id,
    actorId: actorId ?? userId,
    type: "ACTION_COMPLETED",
  });

  void trackDemoEvent(DemoEvents.ACTION_QUEUE_COMPLETED, { type: updated.type }, userId);

  return updated;
}

export async function dismissActionQueueItem(
  id: string,
  userId: string,
  actorId?: string | null
): Promise<ActionQueueItem | null> {
  const row = await prisma.actionQueueItem.findFirst({ where: { id, userId } });
  if (!row) return null;

  const updated = await prisma.actionQueueItem.update({
    where: { id },
    data: { status: "DISMISSED" },
  });

  await logQueueEvent({
    actionQueueItemId: id,
    actorId: actorId ?? userId,
    type: "ACTION_DISMISSED",
  });

  void trackDemoEvent(DemoEvents.ACTION_QUEUE_DISMISSED, { type: updated.type }, userId);

  return updated;
}

/** Completes all open queue rows for a user matching source (e.g. contract signed). */
export async function completeOpenActionQueueBySource(
  userId: string,
  params: {
    sourceType: string;
    sourceId: string;
    types?: ActionQueueItemType[];
  },
  actorId?: string | null
): Promise<number> {
  const where: Prisma.ActionQueueItemWhereInput = {
    userId,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    status: { in: ["OPEN", "IN_PROGRESS"] },
  };
  if (params.types?.length) {
    where.type = { in: params.types };
  }
  const items = await prisma.actionQueueItem.findMany({ where, select: { id: true } });
  for (const it of items) {
    await completeActionQueueItem(it.id, userId, actorId ?? userId);
  }
  return items.length;
}

export async function reopenActionQueueItem(
  id: string,
  userId: string,
  actorId?: string | null
): Promise<ActionQueueItem | null> {
  const row = await prisma.actionQueueItem.findFirst({ where: { id, userId } });
  if (!row) return null;

  const updated = await prisma.actionQueueItem.update({
    where: { id },
    data: {
      status: "OPEN",
      completedAt: null,
    },
  });

  await logQueueEvent({
    actionQueueItemId: id,
    actorId: actorId ?? userId,
    type: "STATUS_CHANGED",
    message: "reopened",
  });

  return updated;
}
