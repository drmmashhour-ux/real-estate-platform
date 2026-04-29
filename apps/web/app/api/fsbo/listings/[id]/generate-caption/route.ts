import { getLegacyDB } from "@/lib/db/legacy";
import { getGuestId } from "@/lib/auth/session";
import { buildCaptionInput } from "@/lib/listings/caption-input";
import { generateCaption } from "@/lib/listings/generate-caption";

const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * POST — factual caption scaffold only (no address / PII); optional AI when AI_CAPTIONS_ENABLED=true.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findFirst({
    where: { id, ownerId: userId },
    select: {
      title: true,
      city: true,
      region: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      yearBuilt: true,
      experienceTags: true,
      servicesOffered: true,
      listingDealType: true,
      status: true,
    },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  const input = buildCaptionInput(listing);
  const out = await generateCaption(input);

  return Response.json({
    caption: out.caption,
    source: out.source,
    inputSummary: {
      city: input.city,
      propertyType: input.propertyType,
      listingKind: input.listingKind,
    },
  });
}
