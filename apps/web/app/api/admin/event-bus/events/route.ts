import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listEvents } from "@/lib/platform-event-bus";

/**
 * GET /api/admin/event-bus/events
 * Query: eventType, sourceModule, processingStatus, entityType, entityId, since (ISO date), limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType") ?? undefined;
    const sourceModule = searchParams.get("sourceModule") ?? undefined;
    const processingStatus = searchParams.get("processingStatus") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const since = searchParams.get("since");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const events = await listEvents({
      eventType,
      sourceModule,
      processingStatus,
      entityType,
      entityId,
      since: since ? new Date(since) : undefined,
      limit,
    });
    return Response.json({ events });
  } catch (e) {
    return Response.json({ error: "Failed to list events" }, { status: 500 });
  }
}
