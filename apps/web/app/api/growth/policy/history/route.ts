import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import {
  buildGrowthPolicyHistorySummary,
  listGrowthPolicyHistory,
} from "@/modules/growth/policy/growth-policy-history.service";
import { getGrowthPolicyHistoryPersistenceMeta } from "@/modules/growth/policy/growth-policy-history.store";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.growthPolicyV1 || !engineFlags.growthPolicyHistoryV1) {
    return NextResponse.json({ error: "Growth policy history disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const entries = listGrowthPolicyHistory();
    const summary = buildGrowthPolicyHistorySummary();
    const persistence = getGrowthPolicyHistoryPersistenceMeta();
    return NextResponse.json({ entries, summary, persistence });
  } catch (e) {
    console.error("[growth:policy-history]", e);
    return NextResponse.json({ error: "Failed to load policy history" }, { status: 500 });
  }
}
