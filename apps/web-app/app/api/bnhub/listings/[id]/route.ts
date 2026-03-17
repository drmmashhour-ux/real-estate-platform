import { NextRequest } from "next/server";
import { getListingById, updateListing } from "@/lib/bnhub/listings";
import { canPublishListing } from "@/lib/verification/ownership";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

function buildUpdateData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const fields = [
    "title", "subtitle", "description", "propertyType", "roomType", "category",
    "address", "city", "region", "country", "nightPriceCents", "currency",
    "beds", "bedrooms", "baths", "maxGuests", "houseRules", "checkInInstructions",
    "checkInTime", "checkOutTime", "cancellationPolicy", "cleaningFeeCents",
    "securityDepositCents", "taxRatePercent", "instantBookEnabled",
    "minStayNights", "maxStayNights", "listingStatus", "parkingDetails", "neighborhoodDetails",
  ];
  for (const k of fields) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (Array.isArray(body.photos)) data.photos = body.photos;
  if (Array.isArray(body.amenities)) data.amenities = body.amenities;
  if (Array.isArray(body.safetyFeatures)) data.safetyFeatures = body.safetyFeatures;
  if (Array.isArray(body.accessibilityFeatures)) data.accessibilityFeatures = body.accessibilityFeatures;
  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = buildUpdateData(body);
    if (data.listingStatus === "PUBLISHED") {
      const allowed = await canPublishListing(id);
      if (!allowed) {
        const listing = await getListingById(id);
        const underInvestigation = listing?.listingStatus === "UNDER_INVESTIGATION";
        return Response.json(
          {
            error: underInvestigation
              ? "This listing is under fraud review. An admin must approve it before it can be published."
              : "Only verified listings can be published. Complete ownership verification first.",
          },
          { status: 400 }
        );
      }
    }
    const listing = await updateListing(id, data);
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = buildUpdateData(body);
    if (data.listingStatus === "PUBLISHED") {
      const allowed = await canPublishListing(id);
      if (!allowed) {
        const listing = await getListingById(id);
        const underInvestigation = listing?.listingStatus === "UNDER_INVESTIGATION";
        return Response.json(
          {
            error: underInvestigation
              ? "This listing is under fraud review. An admin must approve it before it can be published."
              : "Only verified listings can be published. Complete ownership verification first.",
          },
          { status: 400 }
        );
      }
    }
    const listing = await updateListing(id, data);
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
