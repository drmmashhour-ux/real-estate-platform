import { NextRequest } from "next/server";
import { getQueueItems, enqueueItem } from "@/lib/ai/queue";
import type { QueueItemType } from "@/lib/ai/queue";

export const dynamic = "force-dynamic";

/** GET /api/ai/queue – list queue items. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "pending" | "flagged" | "approved" | "rejected" | undefined;
    const type = searchParams.get("type") as QueueItemType | undefined;
    const limit = parseInt(searchParams.get("limit") ?? "50", 10) || 50;
    const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

    const items = await getQueueItems({
      status: status ?? undefined,
      type: type ?? undefined,
      limit,
      offset,
    });
    return Response.json({ items });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get queue", items: [] }, { status: 500 });
  }
}

/** POST /api/ai/queue – enqueue an item. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, entityId } = body as { type?: string; entityId?: string };
    if (!type || !entityId) {
      return Response.json(
        { error: "type and entityId required (e.g. type: listing, entityId: uuid)" },
        { status: 400 }
      );
    }
    const allowed: QueueItemType[] = ["listing", "booking", "user", "dispute"];
    if (!allowed.includes(type as QueueItemType)) {
      return Response.json({ error: `type must be one of: ${allowed.join(", ")}` }, { status: 400 });
    }
    const item = await enqueueItem(type as QueueItemType, entityId);
    return Response.json({ item });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to enqueue" }, { status: 500 });
  }
}
