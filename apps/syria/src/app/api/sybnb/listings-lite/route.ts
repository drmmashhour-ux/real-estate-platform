import { NextResponse } from "next/server";
import { fetchSybnbVerifiedHotelsStrip, searchProperties } from "@/services/search/search.service";
import {
  clampSybnbLitePageSize,
  searchPropertiesResultToSybnbLiteResponse,
  serializedBrowseListingToLite,
  type SybnbListingLiteItem,
} from "@/lib/sybnb/sybnb-listings-lite";
import { LISTING_EDGE_CACHE_CONTROL } from "@/lib/http/listing-api-cache";

/**
 * GET /api/sybnb/listings-lite?... — ORDER SYBNB-81 / SYBNB-82
 * Stay (SYBNB) browse only: minimal listing rows (no descriptions, single image URL, badge hints).
 * Pagination clamped to **8–10** items per response (ORDER SYBNB-104).
 * Optional `stripHotels=1` batches verified HOTEL strip into the same JSON (fewer round trips).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const flat: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    flat[key] = value;
  });

  if (!flat.category?.trim()) {
    flat.category = "stay";
  }

  flat.pageSize = String(clampSybnbLitePageSize(flat.pageSize));

  const stripHotels = url.searchParams.get("stripHotels") === "1";

  try {
    if (stripHotels) {
      const [full, hotelRows] = await Promise.all([
        searchProperties("stay", flat),
        fetchSybnbVerifiedHotelsStrip(flat),
      ]);
      const lite = searchPropertiesResultToSybnbLiteResponse(full);
      const hotelStrip: SybnbListingLiteItem[] = hotelRows.map(serializedBrowseListingToLite);
      return NextResponse.json(
        { ...lite, hotelStrip },
        {
          headers: {
            "Cache-Control": LISTING_EDGE_CACHE_CONTROL,
          },
        },
      );
    }

    const full = await searchProperties("stay", flat);
    const lite = searchPropertiesResultToSybnbLiteResponse(full);
    return NextResponse.json(lite, {
      headers: {
        "Cache-Control": LISTING_EDGE_CACHE_CONTROL,
      },
    });
  } catch (e) {
    console.error("[api/sybnb/listings-lite]", e);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
