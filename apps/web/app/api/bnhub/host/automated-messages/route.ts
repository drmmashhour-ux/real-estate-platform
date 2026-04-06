import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/bnhub/host/automated-messages — web host: recent automation message logs.
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const host = await prisma.user.findUnique({
    where: { id: userId },
    select: { _count: { select: { shortTermListings: true } }, role: true },
  });
  const ok =
    host &&
    (host.role === "HOST" || host.role === "ADMIN" || host._count.shortTermListings > 0);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await prisma.bnhubAutomatedHostMessageLog.findMany({
    where: { hostId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      bookingId: true,
      messageType: true,
      triggerType: true,
      status: true,
      recipient: true,
      content: true,
      locale: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
  });
}
