import { NextResponse } from "next/server";
import type { BrowseSurface } from "@/services/search/search.service";
import { searchProperties } from "@/services/search/search.service";
function parseSurface(v: string | null): BrowseSurface | null {
  const s = (v ?? "").toLowerCase().trim();
  if (s === "sale" || s === "buy") return "sale";
  if (s === "rent") return "rent";
  if (s === "bnhub" || s === "stays") return "bnhub";
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
      { error: "Missing or invalid surface (use sale, rent, or bnhub)." },
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
        "Cache-Control": "private, max-age=0, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
