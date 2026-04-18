import { NextResponse } from "next/server";
import { growthStrategyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthStrategyBundle } from "@/modules/growth/growth-strategy.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthStrategyFlags.growthStrategyV1) {
    return NextResponse.json({ error: "Growth strategy layer disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const bundle = await buildGrowthStrategyBundle();
  if (!bundle) {
    return NextResponse.json({ error: "Strategy bundle unavailable" }, { status: 503 });
  }

  return NextResponse.json({ bundle });
}
