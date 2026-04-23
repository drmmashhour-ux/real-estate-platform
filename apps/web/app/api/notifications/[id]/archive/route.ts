import { NextRequest, NextResponse } from "next/server";
import { archiveNotification } from "@/modules/notifications/services/create-notification";
import { canViewNotification } from "@/modules/notifications/services/notification-permissions";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || !canViewNotification({ id: user.userId, role: user.role }, n)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await archiveNotification(id, user.userId, user.userId);
  return NextResponse.json({ notification: updated });
}
