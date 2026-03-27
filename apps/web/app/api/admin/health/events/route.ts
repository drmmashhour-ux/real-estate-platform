import { NextRequest } from "next/server";
import { recordPlatformEvent, getPlatformEvents } from "@/lib/observability";

export const dynamic = "force-dynamic";

/** GET: recent platform events (for funnel/debug). */
export async function GET(request: NextRequest) {
  try {
    const eventType = request.nextUrl.searchParams.get("eventType") ?? undefined;
    const entityType = request.nextUrl.searchParams.get("entityType") ?? undefined;
    const since = request.nextUrl.searchParams.get("since");
    const limit = request.nextUrl.searchParams.get("limit");
    const events = await getPlatformEvents({
      eventType,
      entityType,
      since: since ? new Date(since) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    return Response.json(events);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get events" }, { status: 500 });
  }
}

/** POST: record a platform event (from services or webhooks). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await recordPlatformEvent({
      eventType: body.eventType,
      entityType: body.entityType,
      entityId: body.entityId,
      payload: body.payload,
      region: body.region,
    });
    return Response.json(event);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record event" }, { status: 500 });
  }
}
