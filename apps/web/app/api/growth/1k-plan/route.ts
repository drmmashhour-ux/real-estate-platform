import { NextResponse } from "next/server";
import { buildDailyActionStats } from "@/modules/growth/growth-daily-actions.service";
import { getDailyGrowthTasks, getGrowthPlanRecommendation } from "@/modules/growth/growth-task-engine.service";
import { buildRevenueTargetStatus } from "@/modules/growth/revenue-target.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const [target, actions] = await Promise.all([buildRevenueTargetStatus(), buildDailyActionStats()]);
    const tasks = getDailyGrowthTasks(actions);
    const recommendation = getGrowthPlanRecommendation(target, actions);
    return NextResponse.json({ target, actions, tasks, recommendation });
  } catch (e) {
    console.error("[growth/1k-plan]", e);
    return NextResponse.json({ error: "Failed to load $1K plan" }, { status: 500 });
  }
}
