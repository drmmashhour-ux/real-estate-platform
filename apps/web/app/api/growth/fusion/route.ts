import { NextResponse } from "next/server";
import { growthFusionFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildFusionBackedAutopilotActions } from "@/modules/growth/growth-fusion-autopilot-bridge.service";
import { buildGrowthFusionContentBridge } from "@/modules/growth/growth-fusion-content-bridge.service";
import { buildGrowthFusionInfluenceBridge } from "@/modules/growth/growth-fusion-influence-bridge.service";
import { buildGrowthFusionSystem } from "@/modules/growth/growth-fusion.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthFusionFlags.growthFusionV1) {
    return NextResponse.json({ error: "Growth Fusion disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const system = await buildGrowthFusionSystem();
  if (!system) {
    return NextResponse.json({ error: "Growth Fusion unavailable" }, { status: 503 });
  }

  const fusionBackedAutopilot = buildFusionBackedAutopilotActions(system.actions);
  const contentBridge = buildGrowthFusionContentBridge(system.summary);
  const influenceBridge = buildGrowthFusionInfluenceBridge(system.actions);

  return NextResponse.json({
    snapshot: system.snapshot,
    summary: system.summary,
    actions: system.actions,
    bridges: {
      fusionBackedAutopilot,
      content: contentBridge,
      influence: influenceBridge,
    },
  });
}
