import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET — list queue rows (broker sees own; admin sees all). */
export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (me?.role !== PlatformRole.ADMIN && me?.role !== PlatformRole.BROKER) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const domain = sp.get("domain") ?? undefined;
    const brokerIdFilter = sp.get("brokerId") ?? undefined;

    const where =
      me.role === PlatformRole.ADMIN
        ? {
            ...(status ? { status } : {}),
            ...(domain ? { domain } : {}),
            ...(brokerIdFilter ? { brokerId: brokerIdFilter } : {}),
          }
        : {
            brokerId: userId,
            ...(status ? { status } : {}),
            ...(domain ? { domain } : {}),
          };

    const items = await prisma.autonomousActionQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        executionEvents: { orderBy: { createdAt: "desc" }, take: 3 },
        approvalEvents: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "queue_failed", items: [] },
      { status: 200 }
    );
  }
}
