import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import { prisma } from "@repo/db";
import { getSellerDisclosure } from "@/lib/bnhub/seller-disclosure";
import { ensureHostListingContract } from "@/lib/contracts/bnhub-host-contracts";
import { ensureSellerListingAgreementForBnhub } from "@/lib/contracts/bnhub-seller-listing-contracts";
import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import {
  hasCurrentLegalRentRightAttestation,
  LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
} from "@/lib/bnhub/legal-rent-attestation-policy";

export const dynamic = "force-dynamic";

/**
 * GET — progress for listing setup wizard (host only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: listingId } = await params;
  const listing = await getListingById(listingId);
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await ensureHostListingContract(listingId).catch(() => {});
  await ensureSellerListingAgreementForBnhub(listingId).catch(() => {});

  const hasAddress = Boolean(
    listing.address?.trim() && listing.city?.trim() && listing.country?.trim()
  );
  const photoCount =
    (listing.listingPhotos?.length ?? 0) > 0
      ? listing.listingPhotos!.length
      : Array.isArray(listing.photos)
        ? listing.photos.filter((p): p is string => typeof p === "string").length
        : 0;
  const hasPhotos = photoCount > 0;

  const hasDetails = Boolean(
    listing.description?.trim() &&
      listing.conditionOfProperty?.trim() &&
      listing.knownIssues != null &&
      String(listing.knownIssues).trim() !== ""
  );

  const disclosure = await getSellerDisclosure(listingId);
  const disclosureDone = Boolean(disclosure?.completedAt && !disclosure?.declinedAt);

  const [sellerContract, hostContract] = await Promise.all([
    prisma.contract.findFirst({
      where: { listingId, type: MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT },
      select: { status: true, signedAt: true },
    }),
    prisma.contract.findFirst({
      where: { listingId, type: MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT },
      select: { status: true, signedAt: true },
    }),
  ]);

  const sellerSigned = sellerContract?.status === "signed" && sellerContract.signedAt;
  const hostSigned = hostContract?.status === "signed" && hostContract.signedAt;
  const contractsDone = Boolean(sellerSigned && hostSigned);

  const publishReady = listing.listingStatus === "PUBLISHED";
  const verificationApproved = listing.listingVerificationStatus === "VERIFIED";
  const legalAttestationDone = hasCurrentLegalRentRightAttestation(
    listing.legalRentRightAttestedAt,
    listing.legalRentRightAttestationVersion
  );

  return Response.json({
    steps: {
      property: hasAddress,
      photos: hasPhotos,
      details: hasDetails,
      disclosure: disclosureDone,
      contracts: contractsDone,
      verification: verificationApproved,
      legalAttestation: legalAttestationDone,
      submit: publishReady,
    },
    meta: {
      photoCount,
      listingStatus: listing.listingStatus,
      listingVerificationStatus: listing.listingVerificationStatus,
      legalRentRightAttestedAt: listing.legalRentRightAttestedAt?.toISOString() ?? null,
      legalRentRightAttestationVersion: listing.legalRentRightAttestationVersion ?? null,
      requiredAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
    },
  });
}
