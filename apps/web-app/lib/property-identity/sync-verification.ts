/**
 * Sync listing verification result to property identity (verifications + owner).
 */

import { prisma } from "@/lib/db";
import { updatePropertyIdentityVerificationScore } from "./verification-score";
import { recordEvent } from "./events";

export async function syncListingVerificationToPropertyIdentity(
  listingId: string,
  adminUserId: string,
  options: { ownerName?: string | null; isBroker?: boolean }
): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { propertyIdentityId: true, listingAuthorityType: true, ownerId: true },
  });
  if (!listing?.propertyIdentityId) return;

  const pid = listing.propertyIdentityId;
  const now = new Date();

  const typesToAdd = [
    "cadastre_check",
    "land_registry_document",
    "identity_match",
    "geo_validation",
    ...(options.isBroker ? ["broker_license_check", "broker_authorization_check"] : []),
  ];
  const existing = await prisma.propertyIdentityVerification.findMany({
    where: { propertyIdentityId: pid, verificationType: { in: typesToAdd }, verificationStatus: "verified" },
    select: { verificationType: true },
  });
  const existingSet = new Set(existing.map((e) => e.verificationType));
  for (const verificationType of typesToAdd) {
    if (existingSet.has(verificationType)) continue;
    await prisma.propertyIdentityVerification.create({
      data: {
        propertyIdentityId: pid,
        verificationType,
        verificationStatus: "verified",
        verifiedBy: adminUserId,
        verifiedAt: now,
      },
    });
  }

  if (options.ownerName) {
    await prisma.propertyIdentityOwner.updateMany({
      where: { propertyIdentityId: pid },
      data: { isCurrent: false },
    });
    await prisma.propertyIdentityOwner.create({
      data: {
        propertyIdentityId: pid,
        ownerName: options.ownerName,
        ownerSource: options.isBroker ? "broker_authorization" : "land_registry_extract",
        isCurrent: true,
      },
    });
    await recordEvent(pid, "ownership_changed", { listingId, ownerName: options.ownerName }, adminUserId);
  }

  await updatePropertyIdentityVerificationScore(pid);
  await recordEvent(pid, "verification_completed", { listingId, verified_by: adminUserId }, adminUserId);
}
