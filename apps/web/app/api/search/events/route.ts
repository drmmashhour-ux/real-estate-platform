import { NextRequest } from "next/server";
import { SearchEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<SearchEventType>([
  SearchEventType.VIEW,
  SearchEventType.CLICK,
  SearchEventType.SAVE,
  SearchEventType.BOOK,
  SearchEventType.SEARCH,
]);

/**
 * POST — record BNHUB search / listing interaction for ranking & profiles.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    eventType?: string;
    listingId?: string;
    metadata?: Record<string, unknown>;
  };

  const eventType = body.eventType as SearchEventType | undefined;
  if (!eventType || !ALLOWED.has(eventType)) {
    return Response.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const userId = await getGuestId();
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || undefined : undefined;

  await trackSearchEvent({
    eventType,
    userId,
    listingId,
    metadata: body.metadata,
  });

  return Response.json({ ok: true });
}
