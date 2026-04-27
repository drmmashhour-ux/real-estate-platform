import { getListingsDB } from "@/lib/db/routeSwitch";
import { requireAuth } from "@/lib/auth/middleware";
import {
  alertIfHighRiskListing,
  alertIfLowConversion,
} from "@/lib/alerts";
import { getCacheOrRedis, setCacheAndRedis } from "@/lib/cache";
import { isDemoDataActive, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoListings } from "@/lib/demo/data";

export async function GET(req: Request) {
  const db = getListingsDB();
  console.log("[LISTINGS DB] getListingsDB()");
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city");
  if (isDemoDataActive(req)) {
    const scenario = parseDemoScenarioFromRequest(req);
    let rows = getDemoListings(scenario);
    if (city?.trim()) {
      const c = city.trim();
      rows = rows.filter((l) => l.city.toLowerCase().includes(c.toLowerCase()));
    }
    const minP = searchParams.get("minPrice");
    const maxP = searchParams.get("maxPrice");
    const minN = minP ? Number(minP) : null;
    const maxN = maxP ? Number(maxP) : null;
    if (minN != null && !Number.isNaN(minN)) rows = rows.filter((l) => l.price >= minN);
    if (maxN != null && !Number.isNaN(maxN)) rows = rows.filter((l) => l.price <= maxN);
    return Response.json(rows);
  }
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const cacheKey = `listings:GET:${city ?? ""}:${minPrice ?? ""}:${maxPrice ?? ""}`;
  const cached = await getCacheOrRedis(cacheKey);
  if (cached != null) {
    return Response.json(cached);
  }

  const rows = await db.listing.findMany({
    where: {
      city: city ? { contains: city, mode: "insensitive" } : undefined,
      price: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ids = rows.map((r) => r.id);
  const bookingGroups =
    ids.length > 0
      ? await db.booking.groupBy({
          by: ["listingId"],
          where: { listingId: { in: ids } },
          _count: { _all: true },
        })
      : [];
  const bookingCountByListingId = new Map(
    bookingGroups.map((g) => [g.listingId, g._count._all])
  );

  const listings = rows.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    city: l.city,
    country: l.country,
    userId: l.userId,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    bookings: bookingCountByListingId.get(l.id) ?? 0,
  }));

  await setCacheAndRedis(cacheKey, listings, 10_000);

  return Response.json(listings);
}

export async function POST(req: Request) {
  const db = getListingsDB();
  console.log("[LISTINGS DB] getListingsDB() POST");
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const listing = await db.listing.create({
    data: {
      title: body.title,
      price: body.price,
      city: body.city,
      country: body.country,
      userId: user.userId,
    },
  });

  // Optional metrics from upstream jobs / webhooks (when present)
  const conversionRate =
    typeof body.conversionRate === "number" ? body.conversionRate : undefined;
  const trustScore =
    typeof body.trustScore === "number" ? body.trustScore : undefined;
  alertIfLowConversion(listing.id, conversionRate);
  alertIfHighRiskListing(listing.id, trustScore);

  const { emit } = await import("@/lib/events");
  await emit("listing.updated", {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    city: listing.city,
    country: listing.country,
    userId: user.userId,
  });

  return Response.json(listing);
}
