import { NextResponse } from "next/server";
import { fetchStayListingsPaged } from "@/lib/lite/lite-queries";
import { parsePagedListQuery } from "@/lib/lite/list-paging";

/**
 * Minimal JSON for Ultra-Lite (`items` only id, title, price, location).
 */
export async function GET(request: Request) {
  try {
    const q = parsePagedListQuery(request.url);
    const { items, hasMore, nextPage } = await fetchStayListingsPaged(q.locale, q.page, q.limit);
    return NextResponse.json(
      {
        ok: true,
        items,
        hasMore,
        nextPage,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=0, stale-while-revalidate=120",
          "Cache-Tag": "syria-lite-listings",
        },
      },
    );
  } catch (e) {
    console.error("[api/lite/listings]", e);
    return NextResponse.json(
      { ok: false, items: [], hasMore: false, nextPage: null as number | null, error: "server" },
      { status: 500 },
    );
  }
}
