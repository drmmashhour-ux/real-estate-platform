import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getCapitalPipelineSummaryForUser } from "@/modules/capital/capital-monitoring.service";
import { capitalSummaryWhenRolloutDisabled, isLecipmPhaseEnabled, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!isLecipmPhaseEnabled(4)) {
    logRolloutGate(4, "/api/capital/pipeline/summary");
    return NextResponse.json(capitalSummaryWhenRolloutDisabled());
  }

  const summary = await getCapitalPipelineSummaryForUser(userId);
  return NextResponse.json(summary);
}
