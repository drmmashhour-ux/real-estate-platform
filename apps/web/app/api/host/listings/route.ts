import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { createHostListingDraft } from "@/lib/host/create-host-listing-draft";

export const dynamic = "force-dynamic";

const LISTING_CARD_SELECT = {
  id: true,
  title: true,
  city: true,
  region: true,
  listingCode: true,
  nightPriceCents: true,
  currency: true,
  listingStatus: true,
  maxGuests: true,
  beds: true,
  bedrooms: true,
  baths: true,
  updatedAt: true,
  createdAt: true,
} as const;

/**
 * GET /api/host/listings — BNHub short-term listings for the signed-in host.
 */
export async function GET() {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: gate.userId },
    select: LISTING_CARD_SELECT,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return Response.json({
    listings: listings.map((l) => ({
      ...l,
      updatedAt: l.updatedAt.toISOString(),
      createdAt: l.createdAt.toISOString(),
      pricePerNight: l.nightPriceCents / 100,
    })),
  });
}

/**
 * POST /api/host/listings — create draft listing (same rules as POST /api/host/listings/draft).
 */
export async function POST(req: NextRequest) {
  const ownerId = await getGuestId();
  if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const gate = await requireBnhubHostAccess(ownerId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!title || !city) {
    return Response.json({ error: "Title and city are required." }, { status: 400 });
  }

  const result = await createHostListingDraft(ownerId, {
    title,
    city,
    address: typeof body.address === "string" ? body.address : undefined,
    propertyType: typeof body.propertyType === "string" ? body.propertyType : undefined,
    roomType: typeof body.roomType === "string" ? body.roomType : undefined,
    maxGuests: body.maxGuests != null ? Number(body.maxGuests) : undefined,
    bedrooms: body.bedrooms != null ? Number(body.bedrooms) : undefined,
    beds: body.beds != null ? Number(body.beds) : undefined,
    baths: body.baths != null ? Number(body.baths) : undefined,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, reasons: result.reasons },
      { status: result.status }
    );
  }

  return Response.json({ id: result.id, listingCode: result.listingCode });
}
