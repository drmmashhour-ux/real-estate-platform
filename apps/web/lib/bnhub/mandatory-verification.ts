/**
 * Mandatory verification for BNHub listing publish.
 * Owner: full name, ID verification, ownership confirmation → pending | verified | rejected
 * Property: address, images required; ownership proof optional.
 */

import { prisma } from "@/lib/db";
import { getBrokerProfessionalCompliance } from "@/lib/compliance/professional-compliance";
import { assertHostAgreementSignedForPublish } from "@/lib/contracts/bnhub-host-contracts";
import { assertSellerAgreementSignedForBnhub } from "@/lib/contracts/bnhub-seller-listing-contracts";
import { assertSellerAgreementTemplateAnswers } from "@/lib/contracts/listing-template-compliance";
import { assertComplianceReviewApprovedIfRequired } from "@/lib/contracts/compliance-review-service";

export type OwnerVerificationStatus =
  | "pending"
  | "verified"
  | "rejected";

export type OwnerVerificationResult = {
  fullNameProvided: boolean;
  idVerificationStatus: "pending" | "verified" | "rejected";
  ownershipConfirmationStatus: "pending" | "confirmed" | "rejected";
  overall: OwnerVerificationStatus;
  reasons: string[];
};

export type PropertyVerificationResult = {
  hasAddress: boolean;
  hasImages: boolean;
  canPublish: boolean;
  reasons: string[];
};

/**
 * Owner verification: full name (User.name), ID (IdentityVerification), ownership confirmation (BnhubHost).
 */
export async function getOwnerVerificationStatus(
  userId: string
): Promise<OwnerVerificationResult> {
  const reasons: string[] = [];
  const [user, identity, host] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, accountStatus: true },
    }),
    prisma.identityVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
    prisma.bnhubHost.findUnique({
      where: { userId },
      select: { ownershipConfirmationStatus: true } as const,
    }),
  ]);

  const fullNameProvided = Boolean(user?.name?.trim());
  if (!fullNameProvided) reasons.push("Full name is required");

  const idVerificationStatus =
    identity?.verificationStatus === "VERIFIED"
      ? "verified"
      : identity?.verificationStatus === "REJECTED"
        ? "rejected"
        : "pending";
  if (idVerificationStatus === "pending")
    reasons.push("ID verification is required");
  if (idVerificationStatus === "rejected")
    reasons.push("ID verification was rejected");

  const ownershipConfirmationStatus =
    host?.ownershipConfirmationStatus === "confirmed"
      ? "confirmed"
      : host?.ownershipConfirmationStatus === "rejected"
        ? "rejected"
        : "pending";
  if (ownershipConfirmationStatus === "pending")
    reasons.push("Ownership confirmation is required");
  if (ownershipConfirmationStatus === "rejected")
    reasons.push("Ownership confirmation was rejected");

  if (user?.accountStatus !== "ACTIVE") {
    reasons.push("Account must be active");
  }

  const allMet =
    fullNameProvided &&
    idVerificationStatus === "verified" &&
    ownershipConfirmationStatus === "confirmed" &&
    user?.accountStatus === "ACTIVE";
  const anyRejected =
    idVerificationStatus === "rejected" ||
    ownershipConfirmationStatus === "rejected";

  const overall: OwnerVerificationStatus = anyRejected
    ? "rejected"
    : allMet
      ? "verified"
      : "pending";

  return {
    fullNameProvided,
    idVerificationStatus,
    ownershipConfirmationStatus,
    overall,
    reasons,
  };
}

/**
 * Property verification: address, images, description, price, location, condition, known issues.
 */
export async function getPropertyVerificationStatus(
  listingId: string
): Promise<PropertyVerificationResult> {
  const reasons: string[] = [];
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      address: true,
      city: true,
      country: true,
      description: true,
      nightPriceCents: true,
      conditionOfProperty: true,
      knownIssues: true,
      photos: true,
      listingPhotos: { select: { id: true }, take: 1 },
    },
  });

  if (!listing) {
    return {
      hasAddress: false,
      hasImages: false,
      canPublish: false,
      reasons: ["Listing not found"],
    };
  }

  const hasAddress = Boolean(
    listing.address?.trim() &&
      listing.city?.trim() &&
      listing.country?.trim()
  );
  if (!hasAddress) reasons.push("Address (street, city, country) is required");

  const hasDescription = Boolean(listing.description?.trim());
  if (!hasDescription) reasons.push("Description is required");

  const hasPrice = Number(listing.nightPriceCents) > 0;
  if (!hasPrice) reasons.push("Price is required");

  const hasCondition = Boolean(listing.conditionOfProperty?.trim());
  if (!hasCondition) reasons.push("Condition of property is required");

  const hasKnownIssues = listing.knownIssues != null && String(listing.knownIssues).trim() !== "";
  if (!hasKnownIssues) reasons.push("Known issues must be disclosed (use \"None\" if none)");

  const photoUrls =
    Array.isArray(listing.photos) &&
    listing.photos.filter((p): p is string => typeof p === "string");
  const hasListingPhotos = (listing.listingPhotos?.length ?? 0) > 0;
  const hasImages =
    hasListingPhotos || (Array.isArray(photoUrls) && photoUrls.length > 0);
  if (!hasImages) reasons.push("At least one listing image is required");

  const canPublish =
    hasAddress &&
    hasImages &&
    hasDescription &&
    hasPrice &&
    hasCondition &&
    hasKnownIssues;

  return {
    hasAddress,
    hasImages,
    canPublish,
    reasons,
  };
}

/**
 * Disclosure status: seller must have completed the Seller Declaration (not declined).
 */
export async function getDisclosureStatus(
  listingId: string
): Promise<{ completed: boolean; declined: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  const disclosure = await prisma.sellerDisclosure.findUnique({
    where: { listingId },
    select: { completedAt: true, declinedAt: true },
  });
  if (!disclosure) {
    reasons.push("Seller Declaration (disclosure form) must be completed");
    return { completed: false, declined: false, reasons };
  }
  if (disclosure.declinedAt) {
    reasons.push("You cannot publish because the Seller Declaration was declined. Complete the disclosure to publish.");
    return { completed: false, declined: true, reasons };
  }
  if (!disclosure.completedAt) {
    reasons.push("Seller Declaration (disclosure form) must be completed");
    return { completed: false, declined: false, reasons };
  }
  return { completed: true, declined: false, reasons };
}

/**
 * Mandatory gate for publish: owner verified (name + ID + ownership confirmation),
 * property has address + images + description + price + condition + known issues,
 * and seller disclosure completed (not declined).
 */
export async function canPublishListingMandatory(
  listingId: string
): Promise<{ allowed: boolean; reasons: string[] }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      ownerId: true,
      listingStatus: true,
      listingAuthorityType: true,
      brokerLicenseNumber: true,
      brokerageName: true,
    },
  });
  if (!listing) {
    return { allowed: false, reasons: ["Listing not found"] };
  }
  if (listing.listingStatus === "UNDER_INVESTIGATION") {
    return {
      allowed: false,
      reasons: ["Listing is under investigation and cannot be published"],
    };
  }

  const [ownerStatus, propertyStatus, disclosureStatus] = await Promise.all([
    getOwnerVerificationStatus(listing.ownerId),
    getPropertyVerificationStatus(listingId),
    getDisclosureStatus(listingId),
  ]);

  const reasons: string[] = [
    ...ownerStatus.reasons,
    ...propertyStatus.reasons,
    ...disclosureStatus.reasons,
  ];

  let brokerGateOk = true;
  if (listing.listingAuthorityType === "BROKER") {
    const bc = await getBrokerProfessionalCompliance(listing.ownerId);
    if (!bc.ok) reasons.push(...bc.reasons);
    if (!listing.brokerLicenseNumber?.trim()) {
      reasons.push("Broker license number is required on the listing for broker-authorized publication");
    }
    if (!listing.brokerageName?.trim()) {
      reasons.push("Brokerage name is required on the listing for broker-authorized publication");
    }
    brokerGateOk =
      bc.ok && Boolean(listing.brokerLicenseNumber?.trim()) && Boolean(listing.brokerageName?.trim());
  }

  const authorityOk =
    listing.listingAuthorityType === "BROKER"
      ? brokerGateOk
      : ownerStatus.overall === "verified";

  const hostGate = await assertHostAgreementSignedForPublish(listingId);
  if (!hostGate.ok) {
    reasons.push(...hostGate.reasons);
  }

  const sellerAgreementGate = await assertSellerAgreementSignedForBnhub(listingId);
  if (!sellerAgreementGate.ok) {
    reasons.push(...sellerAgreementGate.reasons);
  }

  const templateAnswersGate = await assertSellerAgreementTemplateAnswers(listingId);
  if (!templateAnswersGate.ok) {
    reasons.push(...templateAnswersGate.reasons);
  }

  const complianceGate = await assertComplianceReviewApprovedIfRequired(listingId);
  if (!complianceGate.ok) {
    reasons.push(...complianceGate.reasons);
  }

  const allowed =
    authorityOk &&
    propertyStatus.canPublish &&
    disclosureStatus.completed &&
    hostGate.ok &&
    sellerAgreementGate.ok &&
    templateAnswersGate.ok &&
    complianceGate.ok;

  return { allowed, reasons: [...new Set(reasons)] };
}
