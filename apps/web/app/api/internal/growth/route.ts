import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isGrowthAutomationEnabled } from "@/lib/feature-flags/revenue-growth";
import { prisma } from "@/lib/db";
import { runGrowthAutomation } from "@/modules/growth/application/runGrowthAutomation";

export const dynamic = "force-dynamic";

/** GET — recent growth emails + aggregate counts (admin-only). */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isGrowthAutomationEnabled()) {
    return NextResponse.json(
      { error: "Growth automation disabled", feature: "GROWTH_AUTOMATION_ENABLED" },
      { status: 503 }
    );
  }
  try {
    const [recent, byTrigger, total] = await Promise.all([
      prisma.growthEmailLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          triggerKey: true,
          subject: true,
          createdAt: true,
        },
      }),
      prisma.growthEmailLog.groupBy({
        by: ["triggerKey"],
        _count: { triggerKey: true },
      }),
      prisma.growthEmailLog.count(),
    ]);
    return NextResponse.json({
      recent,
      triggersFired: byTrigger.map((r) => ({ triggerKey: r.triggerKey, count: r._count.triggerKey })),
      totalEmailsLogged: total,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load growth stats";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST — run one batch of growth automation (admin-only). */
export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isGrowthAutomationEnabled()) {
    return NextResponse.json(
      { error: "Growth automation disabled", feature: "GROWTH_AUTOMATION_ENABLED" },
      { status: 503 }
    );
  }
  try {
    const result = await runGrowthAutomation();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Growth run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
