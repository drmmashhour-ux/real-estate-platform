import { NextResponse } from "next/server";
import { growthDecisionJournalFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthDecisionJournalInsights } from "@/modules/growth/growth-decision-journal-bridge.service";
import { buildGrowthDecisionJournalSummary } from "@/modules/growth/growth-decision-journal.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthDecisionJournalFlags.growthDecisionJournalV1) {
    return NextResponse.json({ error: "Growth decision journal disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const summary = await buildGrowthDecisionJournalSummary();
  if (!summary) {
    return NextResponse.json({ error: "Decision journal unavailable" }, { status: 503 });
  }

  const insights = growthDecisionJournalFlags.growthDecisionJournalBridgeV1
    ? buildGrowthDecisionJournalInsights(summary)
    : undefined;

  return NextResponse.json({ summary, insights });
}
