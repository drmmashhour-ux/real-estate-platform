import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isReasonableListingId } from "@/lib/api/safe-params";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { patchShortTermListingForHost } from "@/lib/host/patch-short-term-listing-for-host";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  city: true,
  region: true,
  country: true,
  address: true,
  listingCode: true,
  nightPriceCents: true,
  currency: true,
  listingStatus: true,
  maxGuests: true,
  beds: true,
  bedrooms: true,
  baths: true,
  roomType: true,
  propertyType: true,
  amenities: true,
  photos: true,
  instantBookEnabled: true,
  verificationStatus: true,
  updatedAt: true,
  createdAt: true,
} as const;

/**
 * GET /api/host/listings/[id] — BNHub short-term listing when owned by host.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!isReasonableListingId(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const listing = await prisma.shortTermListing.findFirst({
    where: { id, ownerId: gate.userId },
    select: DETAIL_SELECT,
  });
  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    listing: {
      ...listing,
      pricePerNight: listing.nightPriceCents / 100,
      updatedAt: listing.updatedAt.toISOString(),
      createdAt: listing.createdAt.toISOString(),
    },
  });
}

/**
 * PATCH /api/host/listings/[id] — partial update (shared implementation with wizard PATCH).
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isReasonableListingId(id)) return Response.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await patchShortTermListingForHost(userId, id, body);
  if (!result.ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    listing: {
      ...result.listing,
      pricePerNight: result.listing.nightPriceCents / 100,
    },
  });
}
