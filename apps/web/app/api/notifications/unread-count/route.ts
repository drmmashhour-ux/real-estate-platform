import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const count = await prisma.notification.count({
    where: { userId: user.userId, status: "UNREAD" },
  });

  return NextResponse.json({ count });
}
