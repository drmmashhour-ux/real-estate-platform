import { NextResponse } from "next/server";
import { growthSimulationFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthSimulationBundle } from "@/modules/growth/growth-simulation.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthSimulationFlags.growthSimulationV1) {
    return NextResponse.json({ error: "Growth simulation disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const bundle = await buildGrowthSimulationBundle();
  if (!bundle) {
    return NextResponse.json({ error: "Simulation bundle unavailable" }, { status: 503 });
  }

  return NextResponse.json({ bundle });
}
