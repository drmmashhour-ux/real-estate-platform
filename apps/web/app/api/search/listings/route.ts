import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type SortKey = "ai" | "price_low" | "price_high" | "newest" | "recommended";

/**
 * POST — BNHUB stays search with AI scores on each listing (`ai`, `recommended` sorts).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      city?: string;
      checkIn?: string;
      checkOut?: string;
      guests?: number;
      priceMin?: number;
      priceMax?: number;
      amenities?: string[];
      propertyType?: string;
      sort?: SortKey | string;
    };

    const sortRaw = typeof body.sort === "string" ? body.sort : "ai";
    const sortMap: Record<string, string> = {
      ai: "ai",
      recommended: "recommended",
      price_low: "priceAsc",
      price_high: "priceDesc",
      newest: "newest",
    };
    const sort = sortMap[sortRaw] ?? "ai";

    const userId = await getGuestId();

    const listings = await searchListings({
      city: typeof body.city === "string" ? body.city.trim() || undefined : undefined,
      checkIn: typeof body.checkIn === "string" ? body.checkIn.trim() || undefined : undefined,
      checkOut: typeof body.checkOut === "string" ? body.checkOut.trim() || undefined : undefined,
      guests: typeof body.guests === "number" && body.guests > 0 ? body.guests : undefined,
      minPrice: typeof body.priceMin === "number" && body.priceMin > 0 ? body.priceMin : undefined,
      maxPrice: typeof body.priceMax === "number" && body.priceMax > 0 ? body.priceMax : undefined,
      propertyType: typeof body.propertyType === "string" ? body.propertyType.trim() || undefined : undefined,
      amenitySlugs: Array.isArray(body.amenities) && body.amenities.length ? body.amenities : undefined,
      sort,
      userId,
    });

    return Response.json({ listings });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
