import { NextResponse } from "next/server";
import { growthGovernanceFeedbackFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { buildGrowthGovernanceFeedbackFromSystem } from "@/modules/growth/growth-governance-feedback.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthGovernanceFeedbackFlags.growthGovernanceFeedbackV1) {
    return NextResponse.json({ error: "Growth governance feedback disabled", summary: null }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const bundle = await buildGrowthGovernanceFeedbackFromSystem();
  if (!bundle) {
    return NextResponse.json({ summary: null, insights: [], reviewQueue: [] });
  }

  return NextResponse.json({
    summary: bundle.summary,
    insights: bundle.insights,
    reviewQueue: bundle.reviewQueue,
  });
}
