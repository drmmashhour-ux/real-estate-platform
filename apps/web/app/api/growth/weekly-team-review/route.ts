import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { buildWeeklyTeamReviewPayload } from "@/modules/growth/weekly-team-review.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.weeklyTeamReviewV1) {
    return NextResponse.json({ error: "Weekly team review disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const windowDays = Math.min(30, Math.max(5, Number(url.searchParams.get("windowDays")) || 7));

  const payload = await buildWeeklyTeamReviewPayload(windowDays);
  if (!payload) {
    return NextResponse.json({ error: "Unable to build weekly team review" }, { status: 503 });
  }

  return NextResponse.json({
    ...payload,
    disclaimer:
      "Meeting-oriented summary — correlational signals only; no Stripe, payouts, or automated CRM changes.",
  });
}
