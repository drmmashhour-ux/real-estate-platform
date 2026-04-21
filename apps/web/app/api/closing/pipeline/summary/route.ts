import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getClosingPipelineSummaryForUser } from "@/modules/closing/closing-monitoring.service";
import { closingSummaryWhenRolloutDisabled, isLecipmPhaseEnabled, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!isLecipmPhaseEnabled(5)) {
    logRolloutGate(5, "/api/closing/pipeline/summary");
    return NextResponse.json(closingSummaryWhenRolloutDisabled());
  }

  const summary = await getClosingPipelineSummaryForUser(userId);
  return NextResponse.json(summary);
}
