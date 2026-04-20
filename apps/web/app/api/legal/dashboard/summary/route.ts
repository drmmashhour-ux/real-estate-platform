import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [openAlerts, casesCount, eventsHigh, disputesRecent, criticalAlerts] = await Promise.all([
      prisma.legalAlert.count({ where: { status: "OPEN" } }),
      prisma.legalCase.count(),
      prisma.legalRiskEvent.count({
        where: { score: { gte: 51 } },
      }),
      prisma.commissionLegalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, reasonKey: true, severity: true, createdAt: true, entityType: true, entityId: true },
      }),
      prisma.legalAlert.count({
        where: { riskLevel: "CRITICAL", status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      }),
    ]);

    const riskBuckets = await prisma.propertyLegalProfile.groupBy({
      by: ["latestRiskLevel"],
      _count: { _all: true },
    });

    return NextResponse.json({
      openAlerts,
      casesCount,
      recentHighRiskEventCount: eventsHigh,
      criticalOpenAlerts: criticalAlerts,
      commissionDisputesRecent: disputesRecent,
      propertyRiskBuckets: riskBuckets,
    });
  } catch (e) {
    console.error("GET /api/legal/dashboard/summary", e);
    return NextResponse.json(
      {
        openAlerts: 0,
        casesCount: 0,
        recentHighRiskEventCount: 0,
        criticalOpenAlerts: 0,
        commissionDisputesRecent: [],
        propertyRiskBuckets: [],
      },
      { status: 200 },
    );
  }
}
