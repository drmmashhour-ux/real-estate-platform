import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBrokerApiSession } from "@/modules/mortgage/services/broker-dashboard-api";
import { isMortgageLeadUnlockedForBroker } from "@/modules/mortgage/services/broker-lead-limits";
import { applyMortgageRequestPerformanceStats } from "@/modules/mortgage/services/broker-performance";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["contacted", "approved", "pending"]);

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await getBrokerApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus = body.status?.trim().toLowerCase();
  if (!nextStatus || !ALLOWED.has(nextStatus)) {
    return NextResponse.json({ error: "status must be pending, contacted, or approved" }, { status: 400 });
  }

  const row = await prisma.mortgageRequest.findUnique({
    where: { id },
    select: {
      id: true,
      brokerId: true,
      userId: true,
      status: true,
      assignedAt: true,
      performanceStatsRecorded: true,
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!session.isAdmin) {
    if (row.brokerId !== session.brokerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const unlocked = await isMortgageLeadUnlockedForBroker(session.brokerId, id, session.plan);
    if (!unlocked) {
      return NextResponse.json(
        { error: "Upgrade to Pro to manage this lead", code: "LEAD_LOCKED" },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.mortgageRequest.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      userId: true,
      propertyPrice: true,
      status: true,
      createdAt: true,
      brokerId: true,
      assignedAt: true,
      performanceStatsRecorded: true,
    },
  });

  if (row.brokerId && updated.assignedAt) {
    await applyMortgageRequestPerformanceStats({
      requestId: updated.id,
      brokerId: row.brokerId,
      previousStatus: row.status,
      nextStatus: updated.status,
      assignedAt: updated.assignedAt,
      alreadyRecorded: row.performanceStatsRecorded,
    });
  }

  const shouldPromptClientReview =
    (nextStatus === "contacted" || nextStatus === "approved") &&
    row.status === "pending" &&
    !!row.brokerId;

  return NextResponse.json({
    request: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
    promptClientReview: shouldPromptClientReview,
  });
}
