import { NextResponse } from "next/server";

import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { computeLowRiskAutoViewerGate } from "@/modules/growth/growth-autonomy-auto-gate";
import { parseGrowthAutonomyAutoLowRiskRolloutFromEnv } from "@/modules/growth/growth-autonomy-auto-config";
import { parseGrowthAutonomyRolloutFromEnv } from "@/modules/growth/growth-autonomy-config";
import { growthAutonomyApiRequestHasDebug } from "@/modules/growth/growth-autonomy-debug";
import { buildGrowthAutonomySnapshot } from "@/modules/growth/growth-autonomy.service";
import { executeGrowthAutonomyLowRiskAuto } from "@/modules/growth/growth-autonomy-execution.service";
import { listRecentGrowthAutonomyLowRiskExecutions } from "@/modules/growth/growth-autonomy-execution.repository";
import { getGrowthAutonomyExecutionMonitoringSnapshot } from "@/modules/growth/growth-autonomy-execution-monitoring.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!growthAutonomyFlags.growthAutonomyAutoLowRiskV1) {
    return NextResponse.json({ ok: false, message: "Auto-low-risk execution is disabled." }, { status: 403 });
  }

  const recent = await listRecentGrowthAutonomyLowRiskExecutions({
    operatorUserId: auth.userId,
    limit: 25,
  });

  const debugReq = growthAutonomyApiRequestHasDebug(req);
  const withMon =
    debugReq || process.env.NODE_ENV !== "production"
      ? { monitoring: getGrowthAutonomyExecutionMonitoringSnapshot() }
      : {};

  return NextResponse.json({
    ok: true,
    recent,
    ...withMon,
  });
}

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (
    growthAutonomyFlags.growthAutonomyKillSwitch ||
    !growthAutonomyFlags.growthAutonomyAutoLowRiskV1 ||
    !growthAutonomyFlags.growthAutonomyV1
  ) {
    return NextResponse.json({ ok: false, message: "Blocked by kill switch or feature flags." }, { status: 403 });
  }

  const urlParams = new URL(req.url).searchParams;
  const locale = urlParams.get("locale") ?? "en";
  const country = urlParams.get("country") ?? "ca";
  const growthDashboardPath = `/${locale}/${country}/dashboard/growth`;

  const rolloutStage = parseGrowthAutonomyRolloutFromEnv();
  const debugReq = growthAutonomyApiRequestHasDebug(req);
  const surfaceDebug =
    debugReq ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_GROWTH_AUTONOMY_DEBUG === "1";

  const autoRolloutStage = parseGrowthAutonomyAutoLowRiskRolloutFromEnv();
  const gate = computeLowRiskAutoViewerGate({
    autoRolloutStage,
    autonomyRolloutStage: rolloutStage,
    userId: auth.userId,
    role: auth.role,
    debugRequest: debugReq,
  });

  const snapshot = await buildGrowthAutonomySnapshot({
    growthDashboardPath,
    surfaceDebug,
    autoLowRiskContext: {
      cohortBucket: gate.cohortBucket,
      viewerMayReceiveAutoExecution: gate.mayReceiveAutoExecution,
      autoRolloutStage,
    },
  });

  if (!gate.mayReceiveAutoExecution || autoRolloutStage === "off") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Viewer cohort or auto-low-risk rollout does not permit server-side auto execution.",
      results: [] as unknown[],
    });
  }

  let bodyMax = 5;
  try {
    const b = (await req.json()) as { maxRuns?: number };
    if (typeof b?.maxRuns === "number") bodyMax = Math.min(10, Math.max(1, b.maxRuns));
  } catch {
    /* optional body */
  }

  const rolloutLabel = `auto:${autoRolloutStage}; autonomy:${snapshot.rolloutStage}`;
  const results: unknown[] = [];
  let ran = 0;

  for (const s of snapshot.suggestions ?? []) {
    if (ran >= bodyMax) break;
    if (s.execution?.resolvedExecutionClass !== "auto_low_risk") continue;

    const r = await executeGrowthAutonomyLowRiskAuto({
      suggestion: s,
      operatorUserId: auth.userId,
      growthDashboardPath,
      rolloutStageLabel: rolloutLabel,
      killSwitchActive: snapshot.killSwitchActive,
    });
    results.push(r);
    if (r.status === "executed") ran += 1;
  }

  return NextResponse.json({ ok: true, results, rolloutStageLabel: rolloutLabel, ran });
}
