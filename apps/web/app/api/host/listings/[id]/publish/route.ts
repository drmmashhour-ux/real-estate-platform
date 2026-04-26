import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { updateListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { postCreateShortTermListingFlow } from "@/lib/bnhub/post-create-short-term-listing";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Host publishes a draft (runs same gates as BNHUB create). */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.shortTermListing.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (row.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  await updateListing(id, { listingStatus: "PUBLISHED" });
  const listing = await prisma.shortTermListing.findUniqueOrThrow({ where: { id } });

  const flow = await postCreateShortTermListingFlow({
    listing,
    ownerId: userId,
    address: listing.address,
    city: listing.city,
    region: listing.region,
    country: listing.country,
    cadastreNumber: listing.cadastreNumber,
    municipality: listing.municipality,
    province: listing.province,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.propertyType,
    source: "host_wizard_publish",
  });

  if (flow.publishError) {
    return Response.json(
      {
        error: flow.publishError,
        reasons: flow.publishReasons ?? [],
        listing: flow.listing,
      },
      { status: 400 }
    );
  }

  return Response.json({ listing: flow.listing });
}
