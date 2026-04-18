import { NextResponse } from "next/server";
import { growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";

export const dynamic = "force-dynamic";

/**
 * Read-only enforcement snapshot for advisory gating. Returns null snapshot when enforcement is disabled.
 */
export async function GET() {
  if (!growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    return NextResponse.json({ error: "Growth policy enforcement disabled", snapshot: null }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const snapshot = await buildGrowthPolicyEnforcementSnapshot();
  return NextResponse.json({ snapshot });
}
