import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

/** GET — aggregated execution measurement (Growth Machine authenticated users). */
export async function GET(req: Request) {
  if (!engineFlags.growthExecutionResultsV1) {
    return NextResponse.json({ error: "Growth execution results disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(90, Math.max(7, Number(url.searchParams.get("windowDays")) || 14));

  const summary = await buildGrowthExecutionResultsSummary(windowDays);

  return NextResponse.json({
    summary,
    disclaimer:
      "Measurement and association only — does not prove that Growth panels caused business outcomes; no automation is triggered.",
  });
}
