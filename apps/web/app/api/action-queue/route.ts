import { NextRequest, NextResponse } from "next/server";
import type { ActionQueueItemStatus, ActionQueueItemType, NotificationPriority, Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
  const status = searchParams.get("status") as ActionQueueItemStatus | null;
  const type = searchParams.get("type") as ActionQueueItemType | null;
  const priority = searchParams.get("priority") as NotificationPriority | null;
  const overdue = searchParams.get("overdue") === "1";
  const dueToday = searchParams.get("dueToday") === "1";
  const includeDone = searchParams.get("includeDone") === "1";

  void trackDemoEvent(DemoEvents.ACTION_QUEUE_VIEWED, { role: user.role }, user.userId);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const where: Prisma.ActionQueueItemWhereInput = { userId: user.userId };

  if (type) where.type = type;
  if (priority) where.priority = priority;

  if (overdue) {
    where.dueAt = { lt: now };
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  } else if (dueToday) {
    where.dueAt = { gte: startOfDay, lt: endOfDay };
    if (!includeDone) where.status = { in: ["OPEN", "IN_PROGRESS"] };
    else if (status) where.status = status;
  } else if (!includeDone) {
    where.status = status ? status : { in: ["OPEN", "IN_PROGRESS"] };
  } else if (status) {
    where.status = status;
  }

  const items = await prisma.actionQueueItem.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.description,
      status: i.status,
      priority: i.priority,
      dueAt: i.dueAt?.toISOString() ?? null,
      completedAt: i.completedAt?.toISOString() ?? null,
      sourceType: i.sourceType,
      sourceId: i.sourceId,
      actionUrl: i.actionUrl,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}
