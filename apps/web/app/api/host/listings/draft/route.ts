import { NextRequest } from "next/server";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { postCreateShortTermListingFlow } from "@/lib/bnhub/post-create-short-term-listing";

export const dynamic = "force-dynamic";

/** Step 1 — create a saved draft the host can continue editing. */
export async function POST(req: NextRequest) {
  try {
    const ownerId = await getGuestId();
    if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (!title || !city) {
      return Response.json({ error: "Title and city are required." }, { status: 400 });
    }

    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : `${city}, QC, Canada`;
    const propertyType =
      typeof body.propertyType === "string" && body.propertyType.trim()
        ? body.propertyType.trim()
        : "Apartment";
    const roomType =
      typeof body.roomType === "string" && body.roomType.trim() ? body.roomType.trim() : "Entire place";
    const maxGuests = body.maxGuests != null ? Math.max(1, parseInt(String(body.maxGuests), 10) || 2) : 2;
    const bedrooms = body.bedrooms != null ? Math.max(0, parseInt(String(body.bedrooms), 10) || 1) : 1;
    const beds = body.beds != null ? Math.max(1, parseInt(String(body.beds), 10) || 1) : 1;
    const baths = body.baths != null ? Math.max(0.5, Number(body.baths) || 1) : 1;

    const gate = await assertCanCreateListing({
      userId: ownerId,
      listingAuthorityType: "OWNER",
      brokerLicenseNumber: null,
      brokerageName: null,
    });
    if (!gate.ok) {
      return Response.json(
        { error: gate.reasons.join(". ") || "You can’t create a listing yet.", reasons: gate.reasons },
        { status: 403 }
      );
    }

    const listing = await createListing({
      ownerId,
      title,
      description: "",
      address,
      city,
      region: "QC",
      country: "CA",
      currency: "CAD",
      nightPriceCents: 13_900,
      roomType,
      beds,
      bedrooms,
      baths,
      maxGuests,
      photos: [],
      amenities: [],
      propertyType,
      listingAuthorityType: "OWNER",
      listingStatus: "DRAFT",
    });

    await postCreateShortTermListingFlow({
      listing,
      ownerId,
      address,
      city,
      region: "QC",
      country: "CA",
      cadastreNumber: null,
      municipality: null,
      province: "QC",
      latitude: null,
      longitude: null,
      propertyType,
      source: "host_wizard_draft",
    });

    return Response.json({ id: listing.id, listingCode: listing.listingCode });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not save draft" },
      { status: 400 }
    );
  }
}
