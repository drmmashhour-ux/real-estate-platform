import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { redisGet, redisSet } from "@/lib/redis";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { measure } from "@/lib/db/loggedQuery";
import { track } from "@/lib/analytics/events";

export const dynamic = "force-dynamic";

const MAX_Q_LEN = 200;

/**
 * GET /api/search — Marketplace `listings` only (`@repo/db-marketplace` via `listingsDB`).
 * Redis 30s TTL; key `search:${q}` (q truncated for safe Redis keys).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q");
    const fromLocation =
      searchParams.get("location") ?? searchParams.get("city") ?? "";
    const combined = (rawQ && rawQ.trim()) || fromLocation.trim() || "";
    const q = combined.slice(0, MAX_Q_LEN);

    if (!q) {
      return Response.json([]);
    }

    void track("search_performed", { query: q });

    const key = `search:${q}`;
    const db = getListingsDB();
    console.log("[SEARCH DB] getListingsDB()");

    const cached = await redisGet(key);
    if (cached != null) {
      return Response.json(cached);
    }

    const listings = await measure("search listingsDB title", () =>
      db.listing.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
        },
        take: 50,
      })
    );

    await redisSet(key, listings, 30);

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const guestId = await getGuestId().catch(() => null);
      void trackDemoEvent(
        DemoEvents.SEARCH,
        { query: q, resultsCount: listings.length, filters: {} },
        guestId
      );
    }

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
