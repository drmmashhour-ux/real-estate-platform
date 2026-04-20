import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildGrowthPolicyTrendSummary } from "@/modules/growth/policy/growth-policy-trend.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.growthPolicyV1 || !engineFlags.growthPolicyTrendsV1) {
    return NextResponse.json({ error: "Growth policy trends disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const w = url.searchParams.get("windowDays");
    const windowDays: 7 | 30 = w === "30" ? 30 : 7;
    const summary = buildGrowthPolicyTrendSummary(windowDays);
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[growth:policy-trends]", e);
    return NextResponse.json({ error: "Failed to build policy trends" }, { status: 500 });
  }
}
