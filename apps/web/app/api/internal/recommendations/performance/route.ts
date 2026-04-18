import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const u = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(u.searchParams.get("days") ?? "14")));
  const since = new Date(Date.now() - days * 86400000);

  const [imp, clk] = await Promise.all([
    prisma.eventLog.count({
      where: { eventType: "recommendation_impression", createdAt: { gte: since } },
    }),
    prisma.eventLog.count({
      where: { eventType: "recommendation_click", createdAt: { gte: since } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    since: since.toISOString(),
    recommendationImpressions: imp,
    recommendationClicks: clk,
    ctr: imp > 0 ? clk / imp : 0,
  });
}
