import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const since30 = subDays(new Date(), 30);
    const rows = await prisma.lecipmDisputePredictionSnapshot.findMany({
      where: {
        riskBand: { in: ["HIGH", "CRITICAL"] },
        createdAt: { gte: since30 },
      },
      orderBy: { disputeRiskScore: "desc" },
      take: 40,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        disputeRiskScore: true,
        predictedCategory: true,
        riskBand: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      highRisk: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[mobile/admin/dispute-prediction/high-risk]", e);
    return NextResponse.json({ error: "high_risk_failed" }, { status: 500 });
  }
}
