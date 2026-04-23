import { NextRequest, NextResponse } from "next/server";
import type { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";

export const dynamic = "force-dynamic";

const STATUS = new Set<NotificationStatus>(["UNREAD", "READ", "ARCHIVED"]);
const TYPES = new Set<string>([
  "MESSAGE",
  "OFFER",
  "CONTRACT",
  "APPOINTMENT",
  "DOCUMENT",
  "INTAKE",
  "CRM",
  "SYSTEM",
  "TASK",
  "REMINDER",
]);

/** GET /api/notifications — paginated list */
export async function GET(request: NextRequest) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 100);
  const cursor = searchParams.get("cursor");
  const status = searchParams.get("status") as NotificationStatus | null;
  const type = searchParams.get("type");
  const unreadOnly = searchParams.get("unread") === "1";

  void trackDemoEvent(DemoEvents.NOTIFICATION_CENTER_VIEWED, { role: user.role }, user.userId);

  const where: Prisma.NotificationWhereInput = {
    userId: user.userId,
  };

  if (unreadOnly) where.status = "UNREAD";
  else if (status && STATUS.has(status)) where.status = status;
  else where.status = { in: ["UNREAD", "READ"] };
  if (type && TYPES.has(type)) where.type = type as NotificationType;

  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return NextResponse.json({
    notifications: page.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      status: n.status,
      priority: n.priority,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() ?? null,
    })),
    nextCursor,
  });
}
