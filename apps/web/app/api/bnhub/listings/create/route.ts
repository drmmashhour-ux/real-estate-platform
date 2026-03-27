import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createListing } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { createOrLink } from "@/lib/property-identity/create-or-link";
import { canPublishListingMandatory } from "@/lib/bnhub/mandatory-verification";
import { ensureHostListingContract } from "@/lib/contracts/bnhub-host-contracts";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

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

    try {
      await ensureHostListingContract(listing.id);
    } catch (e) {
      console.warn("[listings] ensure host contract failed:", e);
    }

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
          await prisma.shortTermListing.update({
            where: { id: listing.id },
            data: { propertyIdentityId: result.propertyIdentityId },
          });
        }
      } catch (e) {
        console.warn("Property identity create-or-link failed (listing still created):", e);
      }
    }

    if (listing.listingStatus === "PUBLISHED") {
      const { allowed, reasons } = await canPublishListingMandatory(listing.id);
      if (!allowed) {
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { listingStatus: "DRAFT" },
        });
        const message =
          reasons.length > 0
            ? reasons.join(". ")
            : "Cannot publish: complete owner verification (full name, ID verification, ownership confirmation) and property details (address, images).";
        return Response.json(
          { error: message, reasons, listingStatus: "DRAFT" },
          { status: 400 }
        );
      }
      if (enforceableContractsRequired()) {
        const signed = await hasActiveEnforceableContract(ownerId, ENFORCEABLE_CONTRACT_TYPES.HOST, {
          listingId: listing.id,
        });
        if (!signed) {
          await prisma.shortTermListing.update({
            where: { id: listing.id },
            data: { listingStatus: "DRAFT" },
          });
          return Response.json(
            {
              error:
                "Sign the BNHub host agreement before publishing (ContractSign kind=host with this listing id).",
              reasons: ["enforceable_host"],
              listingStatus: "DRAFT",
            },
            { status: 400 }
          );
        }
      }
      try {
        const { createListingContract } = await import("@/lib/hubs/contracts");
        await createListingContract({
          listingId: listing.id,
          userId: ownerId,
          hub: "bnhub",
        });
      } catch (e) {
        console.warn("[listings] Failed to create listing contract:", e);
      }
    }

    captureServerEvent(ownerId, AnalyticsEvents.LISTING_CREATED, {
      listingId: listing.id,
      source: "bnhub_create",
    });
    if (listing.listingStatus === "PUBLISHED") {
      captureServerEvent(ownerId, AnalyticsEvents.LISTING_PUBLISHED, {
        listingId: listing.id,
        source: "bnhub_create",
      });
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
