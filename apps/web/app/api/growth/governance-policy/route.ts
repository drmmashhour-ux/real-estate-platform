import { NextResponse } from "next/server";
import { growthGovernancePolicyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthGovernancePolicySnapshot } from "@/modules/growth/growth-governance-policy.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthGovernancePolicyFlags.growthGovernancePolicyV1) {
    return NextResponse.json({ error: "Growth governance policy disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const snapshot = await buildGrowthGovernancePolicySnapshot();
  if (!snapshot) {
    return NextResponse.json({ error: "Policy snapshot unavailable" }, { status: 503 });
  }

  return NextResponse.json({ snapshot });
}
