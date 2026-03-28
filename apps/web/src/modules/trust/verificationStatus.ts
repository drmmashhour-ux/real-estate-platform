import type { BrokerStatus, ListingVerificationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type TrustVerificationBundle = {
  broker: { status: BrokerStatus | null; applicable: boolean };
  host: { verificationStatus: string | null; trustScore: number | null };
  property: {
    listingVerificationStatus: ListingVerificationStatus;
    verificationStatus: VerificationStatus;
    verifiedAt: Date | null;
  };
};

export async function getTrustVerificationForListing(listingId: string): Promise<TrustVerificationBundle | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      listingVerificationStatus: true,
      verificationStatus: true,
      verifiedAt: true,
      ownerId: true,
      owner: { select: { brokerStatus: true, role: true } },
    },
  });
  if (!listing) return null;

  const hostProfile = await prisma.bnhubHostProfile.findUnique({
    where: { userId: listing.ownerId },
    select: { verificationStatus: true, trustScore: true },
  });

  const brokerApplicable = listing.owner.role === "BROKER" || listing.owner.brokerStatus !== "NONE";

  return {
    broker: {
      status: listing.owner.brokerStatus,
      applicable: brokerApplicable,
    },
    host: {
      verificationStatus: hostProfile?.verificationStatus ?? null,
      trustScore: hostProfile?.trustScore ?? null,
    },
    property: {
      listingVerificationStatus: listing.listingVerificationStatus,
      verificationStatus: listing.verificationStatus,
      verifiedAt: listing.verifiedAt,
    },
  };
}
