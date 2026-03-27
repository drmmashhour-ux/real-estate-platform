import { NextResponse } from "next/server";
import { buildWeeklyOptimizationReport } from "@/src/modules/growth-automation/analytics/weeklyOptimizationReport";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart") ?? new Date().toISOString().slice(0, 10);
  const report = await buildWeeklyOptimizationReport({ weekStart });
  return NextResponse.json({ report });
}
