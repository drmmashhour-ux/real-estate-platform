import { prisma } from "@/lib/db";
import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import { SELLER_AGREEMENT_HTML } from "@/lib/contracts/fsbo-seller-contracts";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";
import { getDefaultTemplateForContractType } from "@/modules/contracts/templates";
import type { ContractTemplateDefinition } from "@/modules/contracts/templates";

const SELLER_TYPE = MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT;
const TEMPLATE_VERSION = "2026-03-23";

/**
 * Ensure a pending SELLER_AGREEMENT exists for this BNHUB short-term listing (idempotent).
 */
export async function ensureSellerListingAgreementForBnhub(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) throw new Error("listing_not_found");

  const existing = await prisma.contract.findFirst({
    where: { listingId, type: SELLER_TYPE },
  });
  if (existing) return;

  const def = getDefaultTemplateForContractType(SELLER_TYPE);
  const content: Record<string, unknown> = {
    templateVersion: TEMPLATE_VERSION,
    structuredTemplate: def?.definition ?? null,
  };

  await prisma.contract.create({
    data: {
      type: SELLER_TYPE,
      userId: listing.ownerId,
      listingId,
      status: "pending",
      title: "Seller listing agreement",
      contentHtml: SELLER_AGREEMENT_HTML,
      content: content as object,
      version: TEMPLATE_VERSION,
      hub: "bnhub",
    },
  });
}

export async function assertSellerAgreementSignedForBnhub(
  listingId: string
): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  if (contractEnforcementDisabled()) return { ok: true };

  await ensureSellerListingAgreementForBnhub(listingId);

  const row = await prisma.contract.findFirst({
    where: { listingId, type: SELLER_TYPE },
  });
  if (!row) {
    return { ok: false, reasons: ["Seller listing agreement contract is missing"] };
  }
  if (row.status === "rejected") {
    return { ok: false, reasons: ["Seller listing agreement was rejected"] };
  }
  if (row.status !== "signed" || !row.signedAt) {
    return {
      ok: false,
      reasons: ["Sign the seller listing agreement before publishing (Setup → Contracts or Dashboard → Contracts)."],
    };
  }
  return { ok: true };
}

/** Resolve definition for validation (DB template or code default). */
export async function resolveSellerAgreementDefinition(): Promise<ContractTemplateDefinition | null> {
  const row = await prisma.contractDraftTemplate.findFirst({
    where: { contractType: SELLER_TYPE, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  if (row?.definition && typeof row.definition === "object") {
    return row.definition as ContractTemplateDefinition;
  }
  return getDefaultTemplateForContractType(SELLER_TYPE)?.definition ?? null;
}
