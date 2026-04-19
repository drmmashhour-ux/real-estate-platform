import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildWeeklyReviewSummary } from "@/modules/growth/weekly-review.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.weeklyReviewV1) {
    return NextResponse.json({ error: "Weekly review disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(30, Math.max(3, Number(url.searchParams.get("windowDays")) || 7));

  const summary = await buildWeeklyReviewSummary(windowDays);
  if (!summary) {
    return NextResponse.json({ error: "Summary unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    summary,
    disclaimer:
      "Operator review aid only — compares logged execution windows; does not prove causality or trigger automation.",
  });
}
