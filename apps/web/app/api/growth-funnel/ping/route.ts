import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import { getOrCreateUsageCounter, markReturnVisit } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

export const dynamic = "force-dynamic";

const RETURN_GAP_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: true, tracked: false });

  const before = await getOrCreateUsageCounter(userId);
  const last = before.lastReturnVisitAt?.getTime() ?? 0;
  const now = Date.now();
  if (now - last > RETURN_GAP_MS) {
    await trackGrowthFunnelEvent({
      userId,
      eventName: "return_visit",
      properties: { source: "growth_funnel_ping" },
    });
    await markReturnVisit(userId);
    return NextResponse.json({ ok: true, tracked: true });
  }

  return NextResponse.json({ ok: true, tracked: false });
}
