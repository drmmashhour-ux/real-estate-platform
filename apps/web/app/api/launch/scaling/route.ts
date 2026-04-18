import { NextResponse } from "next/server";
import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildScalingGrowthBundle } from "@/modules/scaling-growth/scaling-growth.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.scalingGrowthV1) {
    return NextResponse.json({ error: "Scaling growth module disabled" }, { status: 403 });
  }

  const bundle = await buildScalingGrowthBundle();
  return NextResponse.json({ bundle });
}
