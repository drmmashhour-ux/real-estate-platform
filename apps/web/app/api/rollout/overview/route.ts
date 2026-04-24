import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/rollout/overview — admin dashboard data. */
export async function GET(_req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "admin_required" }, { status: 403 });
  }

  const policies = await prisma.rolloutPolicy.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      executions: {
        orderBy: { startedAt: "desc" },
        take: 3,
        include: {
          metricSnapshots: { orderBy: { timestamp: "desc" }, take: 5 },
          decisionLogs: { orderBy: { createdAt: "desc" }, take: 12 },
        },
      },
    },
  });

  return NextResponse.json({ ok: true, policies });
}
