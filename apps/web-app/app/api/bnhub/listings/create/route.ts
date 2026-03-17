import { NextRequest } from "next/server";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { createOrLink } from "@/lib/property-identity/create-or-link";

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
      taxRatePercent,
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
      brokerLicenseNumber,
      brokerageName,
    } = body;
    if (!title || !address || !city || nightPriceCents == null || beds == null || baths == null) {
      return Response.json(
        { error: "title, address, city, nightPriceCents, beds, baths required" },
        { status: 400 }
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
      taxRatePercent: taxRatePercent != null ? Number(taxRatePercent) : undefined,
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
    });

    if (address && city) {
      try {
        const result = await createOrLink({
          listingId: listing.id,
          listingType: "short_term_rental",
          linkedByUserId: ownerId,
          cadastreNumber: cadastreNumber ?? null,
          officialAddress: address,
          municipality: municipality ?? null,
          province: province ?? null,
          country: country ?? null,
          latitude: latitude != null ? Number(latitude) : null,
          longitude: longitude != null ? Number(longitude) : null,
          propertyType: propertyType ?? null,
        });
        if (result.linkStatus === "active") {
          const { prisma } = await import("@/lib/db");
          await prisma.shortTermListing.update({
            where: { id: listing.id },
            data: { propertyIdentityId: result.propertyIdentityId },
          });
        }
      } catch (e) {
        console.warn("Property identity create-or-link failed (listing still created):", e);
      }
    }

    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 400 }
    );
  }
}
