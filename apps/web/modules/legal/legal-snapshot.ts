import { prisma } from "@/lib/db";
import { assertFsboContractsSignedForActivation } from "@/lib/contracts/fsbo-seller-contracts";
import { isSellerDeclarationComplete } from "@/lib/fsbo/seller-hub-validation";
import { canPublishListingMandatory } from "@/lib/bnhub/mandatory-verification";
import { hasAcceptedLegalAgreement, LEGAL_AGREEMENT_TYPES } from "@/lib/hubs/agreements";
import { loadUserSignatureKeySet } from "@/modules/legal/legal-signatures";
import type { ComplianceSnapshot } from "@/modules/legal/legal-engine";

export async function buildComplianceSnapshotForBuyerHub(userId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = await loadUserSignatureKeySet(userId);
  return { signedFormKeys };
}

export async function buildComplianceSnapshotForMortgageHub(userId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = await loadUserSignatureKeySet(userId);
  return { signedFormKeys };
}

export async function buildComplianceSnapshotForFsboSeller(userId: string, fsboListingId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = await loadUserSignatureKeySet(userId);
  const listing = await prisma.fsboListing.findFirst({
    where: { id: fsboListingId, ownerId: userId },
    select: { sellerDeclarationJson: true, sellerDeclarationCompletedAt: true, propertyType: true },
  });
  const fsboSellerDeclarationComplete = listing ? isSellerDeclarationComplete(listing) : false;
  const contracts = await assertFsboContractsSignedForActivation(fsboListingId);
  return {
    signedFormKeys,
    fsboSellerDeclarationComplete,
    fsboSellerContractsComplete: contracts.ok,
  };
}

export async function buildComplianceSnapshotForBroker(userId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = await loadUserSignatureKeySet(userId);
  const brokerPlatformAgreementAccepted = await hasAcceptedLegalAgreement(
    userId,
    "broker",
    LEGAL_AGREEMENT_TYPES.BROKER_TERMS
  );
  return { signedFormKeys, brokerPlatformAgreementAccepted };
}

/** BNHub short-term: reuse publish mandatory gate as single legal bundle. */
export async function buildComplianceSnapshotForBnhubShortPublish(listingId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = new Set<string>();
  const { allowed } = await canPublishListingMandatory(listingId);
  return {
    signedFormKeys,
    bnhubShortTermPublishAllowed: allowed,
  };
}

/** Long-term rental listing publish (same BNHub listing model when type is long_term_rental) — optional gate. */
export async function buildComplianceSnapshotForBnhubLongPublish(listingId: string): Promise<ComplianceSnapshot> {
  const signedFormKeys = new Set<string>();
  const { allowed } = await canPublishListingMandatory(listingId);
  return {
    signedFormKeys,
    bnhubLongTermPublishAllowed: allowed,
  };
}
