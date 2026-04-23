import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { runHostAutopilotTrigger } from "@/lib/ai/autopilot/host-autopilot-engine";
import { isHostAutopilotRunApiEnabled } from "@/lib/ai/rollout-guards";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";

export const dynamic = "force-dynamic";

async function requireHost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) return null;
  return user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
}

/** Manual “run checks now” — stalled bookings, payout hints, low performance (no destructive writes except configured safe autopilot paths). */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireHost(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isHostAutopilotRunApiEnabled()) {
    return NextResponse.json({ error: "host_autopilot_api_disabled_by_env" }, { status: 403 });
  }

  const settings = await getManagerAiPlatformSettings();
  if (settings.globalKillSwitch || !settings.automationsEnabled) {
    return NextResponse.json({ error: "autopilot_disabled" }, { status: 403 });
  }

  await runHostAutopilotTrigger(userId, { type: "scheduled_scan" });
  return NextResponse.json({ ok: true });
}
