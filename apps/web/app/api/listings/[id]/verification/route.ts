import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { monolithPrisma } from "@/lib/db/monolith-client";

/**
 * GET /api/listings/:id/verification
 * Returns cadastre_number, verification_status, identity_verification, broker_verification, location_validation.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await context.params;
    const listing = await monolithPrisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        ownerId: true,
        cadastreNumber: true,
        listingVerificationStatus: true,
        listingAuthorityType: true,
        propertyVerification: {
          select: {
            cadastreNumber: true,
            verificationStatus: true,
            verifiedAt: true,
            notes: true,
          },
        },
        propertyLocationValidation: {
          select: {
            latitude: true,
            longitude: true,
            address: true,
            validationStatus: true,
            validatedAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            identityVerifications: {
              take: 1,
              orderBy: { updatedAt: "desc" },
              select: {
                verificationStatus: true,
                verifiedAt: true,
                governmentIdFileUrl: true,
                selfiePhotoUrl: true,
              },
            },
            brokerVerifications: {
              take: 1,
              orderBy: { updatedAt: "desc" },
              select: {
                licenseNumber: true,
                brokerageCompany: true,
                verificationStatus: true,
                verifiedAt: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const userId = await getGuestId();
    const isOwner = userId === listing.ownerId;
    if (!isOwner && !userId) {
      return Response.json({ error: "Sign in required to view verification details" }, { status: 401 });
    }

    const identityVerification = listing.owner?.identityVerifications?.[0];
    const brokerVerification = listing.owner?.brokerVerifications?.[0];

    const verification_status =
      listing.listingVerificationStatus === "DRAFT"
        ? "draft"
        : listing.listingVerificationStatus === "PENDING_VERIFICATION"
          ? "pending_verification"
          : listing.listingVerificationStatus === "PENDING_DOCUMENTS"
            ? "pending_documents"
            : listing.listingVerificationStatus === "VERIFIED"
              ? "verified"
              : listing.listingVerificationStatus === "REJECTED"
                ? "rejected"
                : "draft";

    return Response.json({
      listing_id: listing.id,
      cadastre_number: listing.cadastreNumber ?? listing.propertyVerification?.cadastreNumber ?? null,
      verification_status,
      identity_verification: identityVerification
        ? {
            verification_status: identityVerification.verificationStatus.toLowerCase(),
            verified_at: identityVerification.verifiedAt,
            has_government_id: !!identityVerification.governmentIdFileUrl,
            has_selfie: !!identityVerification.selfiePhotoUrl,
          }
        : null,
      broker_verification:
        listing.listingAuthorityType === "BROKER" && brokerVerification
          ? {
              license_number: brokerVerification.licenseNumber,
              brokerage_company: brokerVerification.brokerageCompany,
              verification_status: brokerVerification.verificationStatus.toLowerCase(),
              verified_at: brokerVerification.verifiedAt,
            }
          : null,
      location_validation: listing.propertyLocationValidation
        ? {
            latitude: listing.propertyLocationValidation.latitude,
            longitude: listing.propertyLocationValidation.longitude,
            address: listing.propertyLocationValidation.address,
            validation_status: listing.propertyLocationValidation.validationStatus.toLowerCase(),
            validated_at: listing.propertyLocationValidation.validatedAt,
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch verification" },
      { status: 500 }
    );
  }
}
