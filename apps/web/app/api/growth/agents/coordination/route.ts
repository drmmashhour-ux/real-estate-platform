import { NextResponse } from "next/server";
import { growthMultiAgentFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { coordinateGrowthAgents } from "@/modules/growth/growth-agent-coordinator.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthMultiAgentFlags.growthMultiAgentV1) {
    return NextResponse.json({ error: "Multi-agent coordination disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const result = await coordinateGrowthAgents();
  if (!result) {
    return NextResponse.json({ error: "Coordination unavailable" }, { status: 503 });
  }

  return NextResponse.json(result);
}
