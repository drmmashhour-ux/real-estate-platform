import { NextResponse } from "next/server";
import { fetchStayListingsPaged } from "@/lib/lite/lite-queries";
import { parsePagedListQuery } from "@/lib/lite/list-paging";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SYBNB browse index — same slim payload as `/api/lite/listings`; full detail loads on `/sybnb/listings/[id]`.
 */
async function handleListingsGET(request: Request) {
  try {
    const q = parsePagedListQuery(request.url);
    const { items, hasMore, nextPage } = await fetchStayListingsPaged(q.locale, q.page, q.limit);
    return NextResponse.json({
      ok: true,
      items,
      hasMore,
      nextPage,
    });
  } catch (e) {
    console.error("[api/sybnb/listings]", e);
    return NextResponse.json(
      { ok: false, items: [], hasMore: false, nextPage: null as number | null, error: "server" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return sybnbApiCatch(() => handleListingsGET(request));
}
