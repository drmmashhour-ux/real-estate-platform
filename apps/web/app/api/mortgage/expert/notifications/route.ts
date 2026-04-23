import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** GET — recent in-app notifications + unread count */
export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const notifications = await prisma.expertInAppNotification.findMany({
    where: { expertId: session.expert.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      body: true,
      leadId: true,
      kind: true,
      readAt: true,
      createdAt: true,
    },
  });

  const unreadCount = await prisma.expertInAppNotification.count({
    where: { expertId: session.expert.id, readAt: null },
  });

  return NextResponse.json({ notifications, unreadCount });
}

/** POST — mark notifications read (all or by ids) */
export async function POST(req: NextRequest) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const body = await req.json().catch(() => ({}));
  const markAll = body?.markAll === true;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];

  const now = new Date();
  if (markAll) {
    await prisma.expertInAppNotification.updateMany({
      where: { expertId: session.expert.id, readAt: null },
      data: { readAt: now },
    });
    await prisma.mortgageExpert
      .update({
        where: { id: session.expert.id },
        data: { notificationsLastReadAt: now },
      })
      .catch(() => {});
  } else if (ids.length > 0) {
    await prisma.expertInAppNotification.updateMany({
      where: { expertId: session.expert.id, id: { in: ids.slice(0, 50) } },
      data: { readAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
