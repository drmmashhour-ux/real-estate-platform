import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const payouts = await prisma.ambassadorPayout.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => []);
  return NextResponse.json(payouts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ambassadorId = typeof body?.ambassadorId === "string" ? body.ambassadorId : null;
    const status = typeof body?.status === "string" ? body.status : "pending";
    if (!ambassadorId) return NextResponse.json({ error: "ambassadorId required" }, { status: 400 });
    const total = await prisma.commission.aggregate({
      where: { ambassadorId },
      _sum: { amount: true },
    });
    const amount = total._sum.amount ?? 0;
    const payout = await prisma.ambassadorPayout.create({
      data: { ambassadorId, amount, status },
    });
    return NextResponse.json(payout);
  } catch (e) {
    console.error("POST /api/admin/ambassadors/payouts:", e);
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
  }
}
