import { marketplacePrisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { emit } from "@/lib/events";
import {
  alertIfHighRiskListing,
  alertIfLowConversion,
} from "@/lib/alerts";
import { getCacheOrRedis, setCacheAndRedis } from "@/lib/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const cacheKey = `listings:GET:${city ?? ""}:${minPrice ?? ""}:${maxPrice ?? ""}`;
  const cached = await getCacheOrRedis(cacheKey);
  if (cached != null) {
    return Response.json(cached);
  }

  const rows = await marketplacePrisma.listing.findMany({
    where: {
      city: city ? { contains: city, mode: "insensitive" } : undefined,
      price: {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      },
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  const listings = rows.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    city: l.city,
    country: l.country,
    userId: l.userId,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    bookings: l._count.bookings,
  }));

  await setCacheAndRedis(cacheKey, listings, 10_000);

  return Response.json(listings);
}

export async function POST(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const listing = await marketplacePrisma.listing.create({
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
