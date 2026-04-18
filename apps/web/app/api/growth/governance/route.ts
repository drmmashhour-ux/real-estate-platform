import { NextResponse } from "next/server";
import { growthGovernanceFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { evaluateGrowthGovernance } from "@/modules/growth/growth-governance.service";
import { getGrowthFreezeState } from "@/modules/growth/growth-governance-freeze.service";
import type { GrowthGovernanceFreezeState } from "@/modules/growth/growth-governance.types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthGovernanceFlags.growthGovernanceV1) {
    return NextResponse.json({ error: "Growth governance disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const decision = await evaluateGrowthGovernance();
  if (!decision) {
    return NextResponse.json({ error: "Governance unavailable" }, { status: 503 });
  }

  const freeze: GrowthGovernanceFreezeState = getGrowthFreezeState(decision);

  return NextResponse.json({
    decision,
    /** @deprecated Prefer `freezeState` — same payload, stable name for API consumers. */
    freeze,
    freezeState: freeze,
    humanReviewQueue: decision.humanReviewQueue,
  });
}
