import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { getPipelineSummaryForViewer } from "@/modules/deals/deal-monitoring.service";
import { isLecipmPhaseEnabled, logRolloutGate, pipelineSummaryWhenRolloutDisabled } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

const TAG = "[deal-pipeline]";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!isLecipmPhaseEnabled(3)) {
    logRolloutGate(3, "/api/deals/pipeline/summary");
    return NextResponse.json(pipelineSummaryWhenRolloutDisabled());
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const summary = await getPipelineSummaryForViewer(userId, user?.role);
    return NextResponse.json(summary);
  } catch {
    logInfo(`${TAG}`, { error: "summary_failed" });
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
