import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { eventTimelineFlags } from "@/config/feature-flags";
import { buildActorTimeline } from "@/modules/events/event-timeline.service";

export const dynamic = "force-dynamic";

/** User-facing: only the signed-in user's own actor timeline (facts only). */
export async function GET() {
  const viewer = await getGuestId();
  if (!viewer) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!eventTimelineFlags.eventTimelineV1) {
    return NextResponse.json({
      disabled: true,
      events: [],
      summary: { count: 0 },
    });
  }

  try {
    const tl = await buildActorTimeline(viewer);
    const safeEvents = tl.events.map((e) => ({
      id: e.id,
      entityType: e.entityType,
      entityId: e.entityId,
      eventType: e.eventType,
      actorType: e.actorType,
      metadata: null,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      disabled: false,
      events: safeEvents,
      summary: { count: tl.events.length, byType: tl.byType },
    });
  } catch {
    return NextResponse.json({ events: [], summary: { count: 0 } }, { status: 200 });
  }
}
