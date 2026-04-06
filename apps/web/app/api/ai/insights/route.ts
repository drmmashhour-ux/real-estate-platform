import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { toolGetAdminMetrics } from "@/lib/ai/tools/registry";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin/host-safe insights: admins get platform counts; others get empty operational summary. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isPlatformAdmin(userId);
  if (!admin) {
    return NextResponse.json({
      role: "user",
      summary:
        "Operational metrics are limited to your account. Use host or guest dashboards for booking and listing status.",
      metrics: null,
    });
  }

  const m = await toolGetAdminMetrics(userId);
  const since7d = new Date(Date.now() - 7 * 864e5);
  const [pendingApprovals, recentErrors, fraudRiskMedium7d, fraudRiskHigh7d] = await Promise.all([
    prisma.managerAiApprovalRequest.count({ where: { status: "pending" } }),
    prisma.managerAiAgentRun.count({ where: { status: "failed", createdAt: { gte: new Date(Date.now() - 864e5) } } }),
    prisma.aiFraudRiskLog.count({
      where: { riskLevel: "MEDIUM", createdAt: { gte: since7d } },
    }),
    prisma.aiFraudRiskLog.count({
      where: { riskLevel: "HIGH", createdAt: { gte: since7d } },
    }),
  ]);

  return NextResponse.json({
    role: "admin",
    metrics: m.ok ? m.data : null,
    pendingApprovals,
    recentFailedRuns24h: recentErrors,
    bnhubFraudRiskLogs7d: { medium: fraudRiskMedium7d, high: fraudRiskHigh7d },
    summary:
      m.ok
        ? `Last 24h new bookings: ${m.data.bookingsLast24h}. Pending pipeline bookings: ${m.data.pendingBookings}. Active STR listings (published/approved): ${m.data.activeStrListings}. Open disputes (review states): ${m.data.openDisputes}. Figures are database counts only — not growth claims.`
        : "Metrics temporarily unavailable.",
  });
}
