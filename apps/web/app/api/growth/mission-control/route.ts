import { NextResponse } from "next/server";
import { growthMissionControlFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthMissionControlSummary } from "@/modules/growth/growth-mission-control.service";
import { buildMissionControlActionBundle } from "@/modules/growth/growth-mission-control-action.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthMissionControlFlags.growthMissionControlV1) {
    return NextResponse.json({ error: "Growth mission control disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = await buildGrowthMissionControlSummary();
  if (!summary) {
    return NextResponse.json({ error: "Mission control summary unavailable" }, { status: 503 });
  }

  const actionBundle = buildMissionControlActionBundle(summary);

  return NextResponse.json({ summary, actionBundle });
}
