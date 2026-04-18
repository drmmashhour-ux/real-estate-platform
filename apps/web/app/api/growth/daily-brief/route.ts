import { NextResponse } from "next/server";
import { growthDailyBriefFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthDailyBrief } from "@/modules/growth/growth-daily-brief.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthDailyBriefFlags.growthDailyBriefV1) {
    return NextResponse.json({ error: "Growth daily brief disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const brief = await buildGrowthDailyBrief();
  return NextResponse.json({ brief });
}
