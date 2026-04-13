import { prisma } from "@/lib/db";
import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import { NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-short-term-rental-agreement";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";

/** Keep in sync with `lib/bnhub/host.ts` host agreement version. */
const HOST_AGREEMENT_VERSION = "2025-03-22";

const HOST_TYPE = MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT;

/**
 * Ensure a pending HOST_AGREEMENT contract exists for this BNHUB short-term listing.
 */
export async function ensureHostListingContract(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, id: true },
  });
  if (!listing) throw new Error("listing_not_found");

  const existing = await prisma.contract.findFirst({
    where: { listingId, type: HOST_TYPE },
  });
  if (existing) return;

  await prisma.contract.create({
    data: {
      type: HOST_TYPE,
      userId: listing.ownerId,
      listingId,
      status: "pending",
      title: "BNHUB short-term host agreement",
      contentHtml: NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML,
      version: HOST_AGREEMENT_VERSION,
      hub: "bnhub",
    },
  });
}

export async function assertHostAgreementSignedForPublish(
  listingId: string
): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  if (contractEnforcementDisabled()) return { ok: true };

  await ensureHostListingContract(listingId);

  const row = await prisma.contract.findFirst({
    where: { listingId, type: HOST_TYPE },
  });
  if (!row) {
    return { ok: false, reasons: ["Host agreement contract is missing"] };
  }
  if (row.status === "rejected") {
    return { ok: false, reasons: ["Host agreement was rejected"] };
  }
  if (row.status !== "signed" || !row.signedAt) {
    return {
      ok: false,
      reasons: ["Sign the BNHUB host agreement before publishing (Dashboard → Contracts or complete host onboarding)."],
    };
  }
  return { ok: true };
}

/**
 * After host accepts terms on /bnhub/host-agreement, mark all pending HOST_AGREEMENT contracts for their listings as signed.
 */
export async function syncHostAgreementAcceptanceToContracts(userId: string): Promise<void> {
  const acceptedAt = new Date();
  await prisma.contract.updateMany({
    where: {
      userId,
      type: HOST_TYPE,
      status: "pending",
    },
    data: {
      status: "signed",
      signedAt: acceptedAt,
      version: HOST_AGREEMENT_VERSION,
    },
  });
}
