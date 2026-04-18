import { NextResponse } from "next/server";
import { growthCadenceFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthCadenceBundle } from "@/modules/growth/growth-cadence.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthCadenceFlags.growthCadenceV1) {
    return NextResponse.json({ error: "Growth cadence disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const bundle = await buildGrowthCadenceBundle();
  if (!bundle) {
    return NextResponse.json({ error: "Cadence bundle unavailable" }, { status: 503 });
  }

  return NextResponse.json({ bundle });
}
