import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getAutonomyEngineSnapshot } from "@/lib/ai/autonomy/autonomy-engine";
import { listAutomationScheduleSummary } from "@/lib/ai/autonomy/autonomy-scheduler";
import { getManagerAiRunCounts } from "@/lib/ai/observability/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAutonomyEngineSnapshot();
  const admin = await isPlatformAdmin(userId);

  if (!admin) {
    return NextResponse.json({
      normalizedMode: snap.normalizedMode,
      globalKillSwitch: snap.globalKillSwitch,
      autonomyPausedUntil: snap.autonomyPausedUntil,
    });
  }

  const since = new Date(Date.now() - 86400000);
  const metrics = await getManagerAiRunCounts(since);
  const schedule = await listAutomationScheduleSummary();

  return NextResponse.json({ ...snap, metrics24h: metrics, automationRules: schedule });
}
