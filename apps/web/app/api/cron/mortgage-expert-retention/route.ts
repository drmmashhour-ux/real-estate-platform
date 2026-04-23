import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { sendDashboardNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/mortgage-expert-retention — weekly-style in-app digest for active experts.
 * Schedule weekly via your job runner + CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 45 * 86400000);
  const experts = await prisma.mortgageExpert.findMany({
    where: {
      isActive: true,
      acceptedTerms: true,
      OR: [{ dashboardLastSeenAt: { gte: since } }, { totalDeals: { gte: 1 } }],
    },
    take: 200,
    select: { id: true, totalDeals: true, rating: true, reviewCount: true },
  });

  let sent = 0;
  for (const e of experts) {
    void sendDashboardNotification({
      mortgageExpertId: e.id,
      kind: "expert_performance_digest",
      title: "Your expert performance",
      body: `Snapshot: ${e.totalDeals} closed deals · ${e.rating.toFixed(1)}★ (${e.reviewCount} reviews). Faster replies and higher ratings increase priority for routed leads.`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, notificationsQueued: sent });
}
