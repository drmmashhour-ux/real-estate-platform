/**
 * Property ownership verification: owner vs broker flows,
 * duplicate listing prevention, and verification state transitions.
 * Triple verification: cadastre + identity/broker + geo-location.
 */

import { prisma } from "@/lib/db";
import type { ListingAuthorityType, ListingVerificationStatus } from "@prisma/client";
import { validateCadastreNumber } from "./cadastre";
import { upsertPropertyLocationValidation } from "./geo-validation";

const LISTING_TYPE_BNHUB = "BNHUB";

export type SubmitForVerificationInput = {
  listingId: string;
  ownerId: string;
  listingAuthorityType: ListingAuthorityType;
  cadastreNumber: string;
  municipality: string;
  province: string;
  address: string;
  brokerLicenseNumber?: string;
  brokerageName?: string;
  hasLandRegistryExtract: boolean;
  hasBrokerAuthorization: boolean; // required when authority = BROKER
};

export type VerificationResult =
  | { ok: true; listingVerificationStatus: ListingVerificationStatus }
  | { ok: false; error: string };

/**
 * Ensure only one active (verified or pending) listing per cadastre when authority is OWNER.
 * Brokers can have multiple listings for the same cadastre (authorization doc covers it).
 */
export async function checkDuplicateCadastre(
  cadastreNumber: string,
  listingAuthorityType: ListingAuthorityType,
  excludeListingId?: string
): Promise<{ duplicate: boolean; existingListingId?: string }> {
  if (listingAuthorityType !== "OWNER") return { duplicate: false };

  const normalized = cadastreNumber.trim();
  const existing = await prisma.shortTermListing.findFirst({
    where: {
      cadastreNumber: normalized,
      listingAuthorityType: "OWNER",
      listingVerificationStatus: { in: ["PENDING_VERIFICATION", "VERIFIED"] },
      id: excludeListingId ? { not: excludeListingId } : undefined,
    },
    select: { id: true },
  });
  return existing
    ? { duplicate: true, existingListingId: existing.id }
    : { duplicate: false };
}

/**
 * Submit a listing for ownership/broker verification.
 * Validates required fields and documents, then sets status to PENDING_VERIFICATION.
 */
export async function submitListingForVerification(
  input: SubmitForVerificationInput
): Promise<VerificationResult> {
  const cadastreValidation = validateCadastreNumber(input.cadastreNumber);
  if (!cadastreValidation.valid) {
    return { ok: false, error: cadastreValidation.error ?? "Invalid cadastre number" };
  }

  if (!input.municipality?.trim()) {
    return { ok: false, error: "Municipality is required" };
  }
  if (!input.province?.trim()) {
    return { ok: false, error: "Province is required" };
  }
  if (!input.address?.trim()) {
    return { ok: false, error: "Address is required" };
  }

  if (input.listingAuthorityType === "BROKER") {
    if (!input.brokerLicenseNumber?.trim()) {
      return { ok: false, error: "Broker license number is required for broker listings" };
    }
    if (!input.brokerageName?.trim()) {
      return { ok: false, error: "Brokerage name is required for broker listings" };
    }
    if (!input.hasBrokerAuthorization) {
      return { ok: false, error: "Broker authorization document is required" };
    }
  }

  if (!input.hasLandRegistryExtract) {
    return { ok: false, error: "Land register extract document is required" };
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    select: { ownerId: true, listingVerificationStatus: true, latitude: true, longitude: true, address: true, municipality: true, province: true },
  });
  if (!listing) {
    return { ok: false, error: "Listing not found" };
  }
  if (listing.ownerId !== input.ownerId) {
    return { ok: false, error: "Not authorized to submit this listing" };
  }
  const allowedStatuses: ListingVerificationStatus[] = ["DRAFT", "PENDING_DOCUMENTS"];
  if (!listing.listingVerificationStatus || !allowedStatuses.includes(listing.listingVerificationStatus)) {
    return { ok: false, error: "Listing cannot be submitted for verification in its current state" };
  }

  const dup = await checkDuplicateCadastre(
    input.cadastreNumber,
    input.listingAuthorityType,
    input.listingId
  );
  if (dup.duplicate) {
    return {
      ok: false,
      error: "Another active listing already exists for this cadastre number (owner listing).",
    };
  }

  await prisma.shortTermListing.update({
    where: { id: input.listingId },
    data: {
      cadastreNumber: input.cadastreNumber.trim(),
      municipality: input.municipality.trim(),
      province: input.province.trim(),
      address: input.address.trim(),
      listingAuthorityType: input.listingAuthorityType,
      listingVerificationStatus: "PENDING_VERIFICATION",
      brokerLicenseNumber: input.brokerLicenseNumber?.trim() ?? null,
      brokerageName: input.brokerageName?.trim() ?? null,
      submittedForVerificationAt: new Date(),
    },
  });

  await prisma.propertyVerification.upsert({
    where: { listingId: input.listingId },
    create: {
      listingId: input.listingId,
      cadastreNumber: input.cadastreNumber.trim(),
      verificationStatus: "PENDING",
    },
    update: {
      cadastreNumber: input.cadastreNumber.trim(),
      verificationStatus: "PENDING",
      verifiedById: null,
      verifiedAt: null,
      notes: null,
      requestMoreDocumentsReason: null,
      requestMoreDocumentsById: null,
      requestMoreDocumentsAt: null,
    },
  });

  // Triple verification: create/update geo-location validation record for admin to verify
  const lat = listing.latitude ?? 0;
  const lon = listing.longitude ?? 0;
  await upsertPropertyLocationValidation({
    listingId: input.listingId,
    latitude: lat !== 0 ? lat : 45.5,
    longitude: lon !== 0 ? lon : -73.5,
    address: [input.address.trim(), input.municipality.trim(), input.province.trim()].join(", "),
    validationStatus: "PENDING",
  });

  return { ok: true, listingVerificationStatus: "PENDING_VERIFICATION" };
}

/**
 * Admin: approve or reject verification. Only allowed when listing is PENDING_VERIFICATION.
 * On approve: sets cadastre (property_verifications), identity for owner (identity_verifications), and location (property_location_validation) to VERIFIED.
 */
export async function setVerificationDecision(
  listingId: string,
  decision: "VERIFIED" | "REJECTED",
  adminUserId: string,
  notes?: string | null
): Promise<VerificationResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      propertyVerification: true,
      propertyLocationValidation: true,
      owner: { select: { name: true } },
      propertyDocuments: { where: { documentType: "LAND_REGISTRY_EXTRACT" }, include: { documentExtractions: true }, take: 1 },
    },
  });
  if (!listing) {
    return { ok: false, error: "Listing not found" };
  }
  if (listing.listingVerificationStatus !== "PENDING_VERIFICATION") {
    return { ok: false, error: "Listing is not pending verification" };
  }

  const now = new Date();

  if (decision === "VERIFIED") {
    // Triple verification: ensure identity (or broker) and location are also set to VERIFIED
    const identityRecord = await prisma.identityVerification.findUnique({ where: { userId: listing.ownerId } });
    const brokerRecord = await prisma.brokerVerification.findUnique({ where: { userId: listing.ownerId } });
    const isOwner = listing.listingAuthorityType === "OWNER";
    if (isOwner && identityRecord && identityRecord.verificationStatus !== "VERIFIED") {
      await prisma.identityVerification.update({
        where: { userId: listing.ownerId },
        data: { verificationStatus: "VERIFIED", verifiedById: adminUserId, verifiedAt: now },
      });
    }
    if (!isOwner && brokerRecord && brokerRecord.verificationStatus !== "VERIFIED") {
      await prisma.brokerVerification.update({
        where: { userId: listing.ownerId },
        data: { verificationStatus: "VERIFIED", verifiedById: adminUserId, verifiedAt: now },
      });
    }
    if (listing.propertyLocationValidation && listing.propertyLocationValidation.validationStatus !== "VERIFIED") {
      await prisma.propertyLocationValidation.update({
        where: { listingId },
        data: { validationStatus: "VERIFIED", validatedById: adminUserId, validatedAt: now },
      });
    }
  }

  await prisma.$transaction([
    prisma.shortTermListing.update({
      where: { id: listingId },
      data: {
        listingVerificationStatus: decision,
        verificationStatus: decision,
        verifiedAt: decision === "VERIFIED" ? now : null,
        rejectionReason: decision === "REJECTED" ? notes ?? "Rejected by admin" : null,
        listingStatus:
          decision === "VERIFIED" ? (listing.listingStatus === "DRAFT" ? "DRAFT" : listing.listingStatus) : listing.listingStatus,
      },
    }),
    prisma.propertyVerification.upsert({
      where: { listingId },
      create: {
        listingId,
        cadastreNumber: listing.cadastreNumber ?? "",
        verificationStatus: decision,
        verifiedById: adminUserId,
        verifiedAt: now,
        notes: notes ?? null,
      },
      update: {
        verificationStatus: decision,
        verifiedById: adminUserId,
        verifiedAt: now,
        notes: notes ?? null,
        requestMoreDocumentsReason: null,
        requestMoreDocumentsById: null,
        requestMoreDocumentsAt: null,
      },
    }),
  ]);

  if (decision === "VERIFIED" && listing.propertyIdentityId) {
    const ownerName =
      listing.propertyDocuments?.[0]?.documentExtractions?.[0]?.ownerName ??
      listing.propertyDocuments?.[0]?.ownerName ??
      listing.owner?.name ??
      null;
    const { syncListingVerificationToPropertyIdentity } = await import("@/lib/property-identity/sync-verification");
    await syncListingVerificationToPropertyIdentity(listingId, adminUserId, {
      ownerName,
      isBroker: listing.listingAuthorityType === "BROKER",
    });
  }

  return {
    ok: true,
    listingVerificationStatus: decision,
  };
}

/**
 * Admin: request more documents. Sets listing to PENDING_DOCUMENTS so lister can resubmit.
 */
export async function requestMoreDocuments(
  listingId: string,
  adminUserId: string,
  reason: string
): Promise<VerificationResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { propertyVerification: true },
  });
  if (!listing) {
    return { ok: false, error: "Listing not found" };
  }
  if (listing.listingVerificationStatus !== "PENDING_VERIFICATION") {
    return { ok: false, error: "Only pending listings can be sent back for more documents" };
  }

  const now = new Date();
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { listingVerificationStatus: "PENDING_DOCUMENTS" },
  });
  await prisma.propertyVerification.update({
    where: { listingId },
    data: {
      requestMoreDocumentsReason: reason,
      requestMoreDocumentsById: adminUserId,
      requestMoreDocumentsAt: now,
    },
  });
  return { ok: true, listingVerificationStatus: "PENDING_DOCUMENTS" };
}

/**
 * Triple verification gate: only verified listings can be published.
 * Requires: cadastre verified, identity (owner) or broker verified, and location validated.
 */
export async function canPublishListing(listingId: string): Promise<boolean> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      listingStatus: true,
      listingVerificationStatus: true,
      listingAuthorityType: true,
      ownerId: true,
      propertyIdentityId: true,
      propertyVerification: { select: { verificationStatus: true } },
      propertyLocationValidation: { select: { validationStatus: true } },
      owner: { select: { accountStatus: true } },
    },
  });
  if (!listing || listing.listingVerificationStatus !== "VERIFIED") {
    return false;
  }
  // Property digital identity: listing must be linked to a property identity
  if (!listing.propertyIdentityId) {
    return false;
  }
  // Anti-fraud: listings under investigation cannot be published until admin clears
  if (listing.listingStatus === "UNDER_INVESTIGATION") {
    return false;
  }
  if (listing.propertyVerification?.verificationStatus !== "VERIFIED") {
    return false;
  }
  if (listing.propertyLocationValidation?.validationStatus !== "VERIFIED") {
    return false;
  }
  if (listing.listingAuthorityType === "OWNER") {
    const identity = await prisma.identityVerification.findUnique({
      where: { userId: listing.ownerId },
      select: { verificationStatus: true },
    });
    if (identity?.verificationStatus !== "VERIFIED") return false;
  } else if (listing.listingAuthorityType === "BROKER") {
    const broker = await prisma.brokerVerification.findUnique({
      where: { userId: listing.ownerId },
      select: { verificationStatus: true },
    });
    if (broker?.verificationStatus !== "VERIFIED") return false;
  }
  // Trust & Safety: owner must not be restricted or banned
  if (listing.owner?.accountStatus !== "ACTIVE") return false;
  return true;
}

/**
 * Whether listing has passed all three checks (for Verified Property badge).
 */
export async function isTripleVerified(listingId: string): Promise<boolean> {
  return canPublishListing(listingId);
}
