import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ListingAdvertisingComplianceContext } from "@/lib/compliance/oaciq/representation-advertising/types";

function stringifyDraft(draft: unknown): string {
  if (draft == null) return "";
  if (typeof draft === "string") return draft;
  try {
    return JSON.stringify(draft);
  } catch {
    return "";
  }
}

function detectComingSoon(marketingLower: string): boolean {
  return (
    marketingLower.includes("coming soon") ||
    marketingLower.includes("coming-soon") ||
    marketingLower.includes("bientôt") ||
    marketingLower.includes("bientot") ||
    marketingLower.includes("teaser")
  );
}

/**
 * Builds deterministic advertising compliance context for CRM listing publish / validation APIs.
 */
export async function buildListingAdvertisingComplianceContext(
  listingId: string,
  brokerUserId: string,
  opts?: { intendedForPublicAdvertising?: boolean },
): Promise<ListingAdvertisingComplianceContext> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      titleFr: true,
      price: true,
      ownerId: true,
      tenantId: true,
      assistantDraftContent: true,
      crmMarketplaceLive: true,
    },
  });

  if (!listing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const draftStr = stringifyDraft(listing.assistantDraftContent);
  const marketingText = [listing.title, listing.titleFr ?? "", draftStr].filter(Boolean).join("\n");
  const marketingLower = marketingText.toLowerCase();

  const [brokerVerification, licenceProfile, mandateContract, latestTx] = await Promise.all([
    prisma.brokerVerification.findUnique({
      where: { userId: brokerUserId },
      select: { verificationStatus: true },
    }),
    prisma.lecipmBrokerLicenceProfile.findUnique({
      where: { userId: brokerUserId },
      select: { fullName: true, licenceType: true, licenceStatus: true },
    }),
    prisma.contract.findFirst({
      where: {
        listingId,
        type: { in: ["broker_agreement", "listing_contract"] },
        signed: true,
      },
      select: { id: true },
    }),
    prisma.lecipmSdTransaction.findFirst({
      where: { listingId },
      orderBy: { updatedAt: "desc" },
      select: { status: true },
    }),
  ]);

  const holdsValidBrokerageLicense =
    brokerVerification?.verificationStatus === VerificationStatus.VERIFIED ||
    licenceProfile?.licenceStatus === "active";

  const licenceName = licenceProfile?.fullName?.trim() ?? "";
  const titleBlob = `${listing.title} ${listing.titleFr ?? ""}`.toLowerCase();
  const licensedNameDisplayedInCreative =
    !licenceName ||
    licenceName
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .some((token) => titleBlob.includes(token.toLowerCase()));

  const licenceDesignationPresent = Boolean(licenceProfile?.licenceType?.trim());

  const statusUpper = latestTx?.status?.toUpperCase() ?? "";
  const isSoldOrCompleted =
    /\b(CLOSED|COMPLETE|COMPLETED|FIRM|SOLD|ARCHIVED|SETTLED)\b/.test(statusUpper) ||
    /\b(vendu|fermé)\b/i.test(marketingText);

  const displaysSoldLabel = /\b(sold|vendu)\b/i.test(marketingText);

  return {
    intendedForPublicAdvertising: opts?.intendedForPublicAdvertising ?? listing.crmMarketplaceLive === true,
    marketingText,
    isComingSoonOrTeaser: detectComingSoon(marketingLower),
    isSoldOrCompleted,
    publicAdShowsNumericPriceWhenSold: isSoldOrCompleted && listing.price > 0,
    displaysSoldLabel,
    broker: {
      holdsValidBrokerageLicense,
      licensedNameDisplayedInCreative,
      licenceDesignationPresent,
      hasSignedBrokerageContractForThisMandate: Boolean(mandateContract),
      isSolicitingAnotherBrokersExclusive: false,
      offersReferralGiftOrCommissionKickback: false,
      isAgencyOperation: Boolean(listing.tenantId),
      agencyHasDocumentedSupervision: true,
    },
  };
}
