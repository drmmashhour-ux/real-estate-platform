import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { redisGet, redisSet } from "@/lib/redis";
import { marketplacePrisma } from "@/lib/db";
import { measure } from "@/lib/db/loggedQuery";

export const dynamic = "force-dynamic";

/**
 * GET /api/search — Search listings.
 *
 * - Default: BNHub `searchListings` (city, price, dates, etc.) with Redis (30s) + `measure` (Orders 93–94).
 * - `?engine=marketplace` — split `marketplace` `listings` table; title `contains` on `q` (Redis 30s). Does not
 *   replace the default; use for slim-schema / demos.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = await getGuestId().catch(() => null);
    if (searchParams.get("engine") === "marketplace") {
      const q = searchParams.get("q") || "";
      const key = `search:mp:${guestId ?? "anon"}:${q}`;
      const cached = await redisGet(key);
      if (cached) {
        return Response.json(cached);
      }
      const listings = await measure("search marketplace listing title", () =>
        marketplacePrisma.listing.findMany({
          where: {
            title: { contains: q, mode: "insensitive" },
          },
          take: 50,
        })
      );
      await redisSet(key, listings, 30);
      return Response.json(listings);
    }

    const rawQ = searchParams.get("q");
    const q = typeof rawQ === "string" ? rawQ.trim() : "";
    const locationParam = searchParams.get("location") ?? searchParams.get("city");
    const location = locationParam?.trim() || (q ? q : undefined);
    const priceMin = searchParams.get("priceMin") ?? searchParams.get("minPrice");
    const priceMax = searchParams.get("priceMax") ?? searchParams.get("maxPrice");
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const sort = searchParams.get("sort") ?? "newest";

    const args = {
      city: location,
      checkIn,
      checkOut,
      minPrice: priceMin ? Number(priceMin) : undefined,
      maxPrice: priceMax ? Number(priceMax) : undefined,
      guests: guests ? Number(guests) : undefined,
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    } as const;

    const searchKey = `search:bnhub:v1:${guestId ?? "anon"}:${searchParams.toString()}`;
    const cachedBnhub = await redisGet(searchKey);
    if (cachedBnhub) {
      return Response.json(cachedBnhub);
    }

    const listings = await measure("searchListings", async () => {
      let list = await searchListings(args);
      if (list.length === 0 && (q || locationParam)) {
        list = await searchListings({
          ...args,
          city: undefined,
        });
      }
      return list;
    });

    await redisSet(searchKey, listings, 30);

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const uid = guestId;
      const resultsCount = listings.length;
      const filters = {
        city: args.city,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        guests: args.guests,
        verifiedOnly: args.verifiedOnly,
        sort: args.sort,
      };
      void trackDemoEvent(
        DemoEvents.SEARCH,
        { query: q || location || "", filters, resultsCount },
        uid
      );
    }

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
