import { NextResponse } from "next/server";
import type { BrowseSurface } from "@/services/search/search.service";
import { searchProperties } from "@/services/search/search.service";
import { LISTING_EDGE_CACHE_CONTROL } from "@/lib/http/listing-api-cache";
function parseSurface(v: string | null): BrowseSurface | null {
  const s = (v ?? "").toLowerCase().trim();
  if (s === "sale" || s === "buy") return "sale";
  if (s === "rent") return "rent";
  if (s === "bnhub" || s === "stays") return "bnhub";
  if (s === "stay" || s === "sybnb") return "stay";
  return null;
}

/**
 * GET /api/search?surface=sale|rent|bnhub&...
 * Shared by browse pages and client refresh (map mode, filters).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const surface = parseSurface(url.searchParams.get("surface"));
  if (!surface) {
    return NextResponse.json(
      { error: "Missing or invalid surface (use sale, rent, bnhub, or stay)." },
      { status: 400 },
    );
  }

  const flat: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    flat[key] = value;
  });

  try {
    const result = await searchProperties(surface, flat);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": LISTING_EDGE_CACHE_CONTROL,
      },
    });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
