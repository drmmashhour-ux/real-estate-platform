import { NextResponse } from "next/server";
import { growthExecutiveFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthExecutiveSummary } from "@/modules/growth/growth-executive.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthExecutiveFlags.growthExecutivePanelV1) {
    return NextResponse.json({ error: "Growth executive panel disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = await buildGrowthExecutiveSummary();
  return NextResponse.json({ summary });
}
