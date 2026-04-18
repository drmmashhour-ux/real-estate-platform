import { NextResponse } from "next/server";
import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildEarlyTractionBundle } from "@/modules/early-traction/early-traction.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.earlyTractionV1) {
    return NextResponse.json({ error: "Early traction module disabled" }, { status: 403 });
  }

  const bundle = await buildEarlyTractionBundle(100);
  return NextResponse.json({ bundle });
}
