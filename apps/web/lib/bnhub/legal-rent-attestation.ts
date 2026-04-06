import { prisma } from "@/lib/db";
import {
  LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
} from "@/lib/bnhub/legal-rent-attestation-policy";

export {
  LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
  LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY,
  hasCurrentLegalRentRightAttestation,
} from "@/lib/bnhub/legal-rent-attestation-policy";

export type RecordAttestationMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export async function recordLegalRentRightAttestation(
  listingId: string,
  hostUserId: string,
  meta?: RecordAttestationMeta
): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, listingVerificationStatus: true },
  });
  if (!listing) return { ok: false, error: "Listing not found" };
  if (listing.ownerId !== hostUserId) return { ok: false, error: "Forbidden" };
  if (listing.listingVerificationStatus !== "VERIFIED") {
    return {
      ok: false,
      error: "Platform ownership verification must be approved before you can confirm the legal right to offer this stay.",
    };
  }

  const now = new Date();
  const notesPayload = {
    version: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
    at: now.toISOString(),
    ip: meta?.ip ?? undefined,
    userAgent: meta?.userAgent ?? undefined,
  };

  await prisma.$transaction([
    prisma.shortTermListing.update({
      where: { id: listingId },
      data: {
        legalRentRightAttestedAt: now,
        legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
      },
    }),
    prisma.listingVerificationLog.create({
      data: {
        listingId,
        step: "LEGAL_RENT_RIGHT_ATTESTATION",
        status: "PASSED",
        notes: JSON.stringify(notesPayload),
        createdBy: hostUserId,
      },
    }),
  ]);

  return { ok: true };
}
