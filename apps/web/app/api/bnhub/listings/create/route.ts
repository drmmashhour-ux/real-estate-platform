import { NextRequest } from "next/server";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { postCreateShortTermListingFlow } from "@/lib/bnhub/post-create-short-term-listing";

export async function POST(request: NextRequest) {
  try {
    const ownerId = await getGuestId();
    if (!ownerId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      propertyType,
      roomType,
      category,
      address,
      city,
      region,
      country,
      nightPriceCents,
      currency,
      beds,
      bedrooms,
      baths,
      maxGuests,
      photos,
      amenities,
      houseRules,
      checkInInstructions,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      cleaningFeeCents,
      securityDepositCents,
      instantBookEnabled,
      minStayNights,
      maxStayNights,
      listingStatus,
      safetyFeatures,
      accessibilityFeatures,
      parkingDetails,
      neighborhoodDetails,
      listingAuthorityType,
      cadastreNumber,
      municipality,
      province,
      latitude,
      longitude,
      brokerLicenseNumber,
      brokerageName,
      conditionOfProperty,
      knownIssues,
    } = body;
    if (!title || !address || !city || nightPriceCents == null || beds == null || baths == null) {
      return Response.json(
        { error: "title, address, city, nightPriceCents, beds, baths required" },
        { status: 400 }
      );
    }

    const authority =
      listingAuthorityType === "OWNER" || listingAuthorityType === "BROKER" ? listingAuthorityType : undefined;
    const createGate = await assertCanCreateListing({
      userId: ownerId,
      listingAuthorityType: authority ?? "OWNER",
      brokerLicenseNumber: brokerLicenseNumber ?? null,
      brokerageName: brokerageName ?? null,
    });
    if (!createGate.ok) {
      return Response.json(
        { error: createGate.reasons.join(". ") || "Listing creation not permitted", reasons: createGate.reasons },
        { status: 403 }
      );
    }

    const listing = await createListing({
      ownerId,
      title,
      subtitle,
      description,
      propertyType,
      roomType,
      category,
      address,
      city,
      region,
      country,
      nightPriceCents: Number(nightPriceCents),
      currency,
      beds: Number(beds),
      bedrooms: bedrooms != null ? Number(bedrooms) : undefined,
      baths: Number(baths),
      maxGuests: maxGuests != null ? Number(maxGuests) : undefined,
      photos: Array.isArray(photos) ? photos : [],
      amenities: Array.isArray(amenities) ? amenities : undefined,
      houseRules,
      checkInInstructions,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      cleaningFeeCents: cleaningFeeCents != null ? Number(cleaningFeeCents) : undefined,
      securityDepositCents: securityDepositCents != null ? Number(securityDepositCents) : undefined,
      instantBookEnabled: Boolean(instantBookEnabled),
      minStayNights: minStayNights != null ? Number(minStayNights) : undefined,
      maxStayNights: maxStayNights != null ? Number(maxStayNights) : undefined,
      listingStatus: listingStatus === "PUBLISHED" ? "PUBLISHED" : undefined,
      safetyFeatures: Array.isArray(safetyFeatures) ? safetyFeatures : undefined,
      accessibilityFeatures: Array.isArray(accessibilityFeatures) ? accessibilityFeatures : undefined,
      parkingDetails,
      neighborhoodDetails,
      listingAuthorityType: listingAuthorityType === "OWNER" || listingAuthorityType === "BROKER" ? listingAuthorityType : undefined,
      cadastreNumber: cadastreNumber != null ? String(cadastreNumber).trim() : undefined,
      municipality: municipality != null ? String(municipality).trim() : undefined,
      province: province != null ? String(province).trim() : undefined,
      brokerLicenseNumber: brokerLicenseNumber != null ? String(brokerLicenseNumber).trim() : undefined,
      brokerageName: brokerageName != null ? String(brokerageName).trim() : undefined,
      conditionOfProperty: conditionOfProperty != null ? String(conditionOfProperty).trim() : undefined,
      knownIssues: knownIssues != null ? String(knownIssues).trim() : undefined,
    });

    const flow = await postCreateShortTermListingFlow({
      listing,
      ownerId,
      address,
      city,
      region,
      country,
      cadastreNumber: cadastreNumber ?? null,
      municipality: municipality ?? null,
      province: province ?? null,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      propertyType: propertyType ?? null,
      source: "bnhub_create",
    });

    if (flow.publishError) {
      return Response.json(
        {
          error: flow.publishError,
          reasons: flow.publishReasons ?? [],
          listingStatus: "DRAFT",
          listing: flow.listing,
        },
        { status: 400 }
      );
    }

    return Response.json(flow.listing);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 400 }
    );
  }
}
