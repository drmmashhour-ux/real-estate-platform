import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET /api/admin/payouts — orchestrated + manual BNHUB payout queues (filters optional). */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const hostId = searchParams.get("hostId")?.trim();
  const method = searchParams.get("payoutMethod")?.trim();

  const manualStatuses = new Set(["queued", "paid", "cancelled"]);
  const orchStatuses = new Set(["scheduled", "sent", "failed"]);

  const orchWhere: Prisma.OrchestratedPayoutWhereInput = {};
  if (status && orchStatuses.has(status)) {
    orchWhere.status = status;
  }
  if (hostId) orchWhere.hostId = hostId;
  if (method) orchWhere.payoutMethod = method;

  const orchestrated = await prisma.orchestratedPayout.findMany({
    where: orchWhere,
    orderBy: { scheduledAt: "asc" },
    take: 200,
    include: {
      host: { select: { id: true, email: true, stripeAccountId: true, stripeOnboardingComplete: true } },
    },
  });

  const manualWhere: { status?: string; hostUserId?: string } = {};
  if (status && manualStatuses.has(status)) {
    manualWhere.status = status;
  }
  if (hostId) manualWhere.hostUserId = hostId;

  const manual = await prisma.bnhubManualHostPayout.findMany({
    where: manualWhere,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      host: { select: { id: true, email: true, stripeAccountId: true } },
    },
  });

  return NextResponse.json({ orchestrated, manual });
}
