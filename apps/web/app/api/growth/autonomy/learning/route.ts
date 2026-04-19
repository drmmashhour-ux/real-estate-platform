import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { growthAutonomyApiRequestHasDebug } from "@/modules/growth/growth-autonomy-debug";
import { buildGrowthAutonomyLearningSnapshotForEmbed } from "@/modules/growth/growth-autonomy-learning.service";
import {
  getGrowthAutonomyLearningMonitoringSnapshot,
} from "@/modules/growth/growth-autonomy-learning-monitoring.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const debugReq = growthAutonomyApiRequestHasDebug(req);
  const allow =
    growthAutonomyFlags.growthAutonomyLearningPanelV1 ||
    debugReq ||
    process.env.NODE_ENV !== "production" ||
    auth.role === PlatformRole.ADMIN;

  if (!allow || !growthAutonomyFlags.growthAutonomyLearningV1) {
    return NextResponse.json({ error: "Growth autonomy learning panel unavailable" }, { status: 403 });
  }

  const killSwitch = growthAutonomyFlags.growthAutonomyKillSwitch;
  const snapshot = await buildGrowthAutonomyLearningSnapshotForEmbed({ killSwitchActive: killSwitch });

  const withMon =
    debugReq || process.env.NODE_ENV !== "production"
      ? { learningMonitoring: getGrowthAutonomyLearningMonitoringSnapshot() }
      : {};

  return NextResponse.json({
    learning: snapshot ?? null,
    killSwitchActive: killSwitch,
    ...withMon,
  });
}
