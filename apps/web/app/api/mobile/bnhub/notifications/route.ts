import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { mapMobileNotification, requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/services/create-notification";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      actionUrl: { startsWith: "/bnhub/booking/" },
      status: unreadOnly ? "UNREAD" : { in: ["UNREAD", "READ"] },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({
    notifications: notifications.map(mapMobileNotification),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const markAll = body?.markAll === true;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((value: unknown) => typeof value === "string") : [];

  if (markAll) {
    const count = await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true, updatedCount: count });
  }

  if (ids.length === 0) {
    return NextResponse.json({ error: "Provide ids or markAll" }, { status: 400 });
  }

  let updatedCount = 0;
  for (const id of ids.slice(0, 50)) {
    const updated = await markNotificationRead(id, user.id, user.id);
    if (updated) updatedCount += 1;
  }

  return NextResponse.json({ ok: true, updatedCount });
}
