import { NextResponse } from "next/server";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { growthAutonomyApiRequestHasDebug } from "@/modules/growth/growth-autonomy-debug";
import { computeGrowthAutonomyTrialOutcomeSummary } from "@/modules/growth/growth-autonomy-trial-results.service";
import { getGrowthAutonomyTrialResultsMonitoringSnapshot } from "@/modules/growth/growth-autonomy-trial-results-monitoring.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!growthAutonomyFlags.growthAutonomyTrialV1) {
    return NextResponse.json({ ok: false, message: "Trial measurement disabled." }, { status: 403 });
  }

  const summary = computeGrowthAutonomyTrialOutcomeSummary();

  const debugReq = growthAutonomyApiRequestHasDebug(req);
  const mon =
    debugReq || process.env.NODE_ENV !== "production"
      ? { trialResultsMonitoring: getGrowthAutonomyTrialResultsMonitoringSnapshot() }
      : {};

  return NextResponse.json({
    ok: true,
    summary,
    ...mon,
  });
}
