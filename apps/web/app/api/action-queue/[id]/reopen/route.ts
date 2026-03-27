import { NextRequest, NextResponse } from "next/server";
import { reopenActionQueueItem } from "@/modules/notifications/services/action-queue";
import { canViewActionQueueItem } from "@/modules/notifications/services/notification-permissions";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const row = await prisma.actionQueueItem.findUnique({ where: { id } });
  if (!row || !canViewActionQueueItem({ id: user.userId, role: user.role }, row)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await reopenActionQueueItem(id, user.userId, user.userId);
  return NextResponse.json({ item: updated });
}
