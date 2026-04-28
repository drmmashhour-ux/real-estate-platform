import { NextResponse } from "next/server";
import { getDemoHadialiteListingSlice } from "@/lib/hadia-lite/demo-products";

/** HadiaLink sandbox pagination — aligns with `/api/lite/listings` in apps/syria. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const density = url.searchParams.get("density");
    let limit = 10;
    if (density === "lite") limit = 5;
    else if (density === "rich") limit = 12;
    const explicit = url.searchParams.get("limit");
    if (explicit != null) {
      const n = parseInt(explicit, 10);
      if (Number.isFinite(n) && n >= 1) limit = Math.min(n, 50);
    }

    const { items, hasMore, nextPage } = getDemoHadialiteListingSlice(page, limit);
    return NextResponse.json({ ok: true, items, hasMore, nextPage });
  } catch (e) {
    console.error("[api/hadia-lite/listings]", e);
    return NextResponse.json(
      { ok: false, items: [], hasMore: false, nextPage: null as number | null },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
