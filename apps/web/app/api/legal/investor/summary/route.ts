import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (u?.role !== PlatformRole.INVESTOR && u?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const [criticalAlerts, highRiskListings, commissionDisputes, resolvedAlerts] = await Promise.all([
      prisma.legalAlert.count({ where: { riskLevel: "CRITICAL", status: "OPEN" } }),
      prisma.propertyLegalProfile.count({
        where: { latestRiskLevel: { in: ["HIGH", "CRITICAL"] } },
      }),
      prisma.commissionLegalEvent.count(),
      prisma.legalAlert.count({ where: { status: "RESOLVED", resolvedAt: { gte: since } } }),
    ]);

    return NextResponse.json({
      openCriticalLegalAlerts: criticalAlerts,
      monitoredHighRiskListings: highRiskListings,
      commissionDisputesUnderReview: commissionDisputes,
      resolvedLegalEventsLast30DaysApprox: resolvedAlerts,
    });
  } catch {
    return NextResponse.json(
      {
        openCriticalLegalAlerts: 0,
        monitoredHighRiskListings: 0,
        commissionDisputesUnderReview: 0,
        resolvedLegalEventsLast30DaysApprox: 0,
      },
      { status: 200 },
    );
  }
}
