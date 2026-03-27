import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import {
  getFsboRequiredContractTypes,
  MARKETPLACE_CONTRACT_TYPES,
  type MarketplaceContractType,
} from "@/lib/contracts/marketplace-contract-types";
import { assertSellerAgreementTemplateAnswers } from "@/lib/contracts/listing-template-compliance";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";
import { NBHUB_LONG_TERM_RENTAL_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-long-term-rental-agreement";
import { NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-broker-collaboration-agreement";

/** Shared HTML for marketplace seller listing agreement (FSBO + BNHub listing attach). */
export const SELLER_AGREEMENT_HTML = `
<h2>Seller listing agreement</h2>
<p>By signing, you confirm you have authority to market this property, that listing details are accurate to the best of your knowledge,
and you agree to the platform&apos;s rules for FSBO listings, lead handling, and compliance with applicable law.</p>
<p>This is a simplified placeholder — replace with counsel-approved terms for production.</p>
`.trim();

const PLATFORM_TERMS_HTML = `
<h2>Platform terms (marketplace)</h2>
<p>By accepting, you agree to LECIPM platform fees where applicable, acceptable use, anti-fraud measures, and data processing
as described in the master terms of service.</p>
<p>This is a simplified placeholder — link to full legal documents in production.</p>
`.trim();

const FSBO_TEMPLATE_VERSION = "2025-03-22";

function titleForType(type: MarketplaceContractType): string {
  switch (type) {
    case MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT:
      return "Seller listing agreement";
    case MARKETPLACE_CONTRACT_TYPES.PLATFORM_TERMS:
      return "Platform marketplace terms";
    case MARKETPLACE_CONTRACT_TYPES.BROKER_COLLABORATION:
      return "Broker collaboration agreement";
    case MARKETPLACE_CONTRACT_TYPES.BROKER_AGREEMENT:
      return "Broker collaboration & commission agreement";
    case MARKETPLACE_CONTRACT_TYPES.RENTAL_AGREEMENT:
      return "Long-term rental agreement";
    case MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT:
      return "Short-term host agreement";
    default:
      return "Agreement";
  }
}

function htmlForType(type: MarketplaceContractType): string {
  switch (type) {
    case MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT:
      return SELLER_AGREEMENT_HTML;
    case MARKETPLACE_CONTRACT_TYPES.PLATFORM_TERMS:
      return PLATFORM_TERMS_HTML;
    case MARKETPLACE_CONTRACT_TYPES.RENTAL_AGREEMENT:
      return NBHUB_LONG_TERM_RENTAL_AGREEMENT_HTML;
    case MARKETPLACE_CONTRACT_TYPES.BROKER_AGREEMENT:
    case MARKETPLACE_CONTRACT_TYPES.BROKER_COLLABORATION:
      return NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML;
    default:
      return "<p>Agreement placeholder.</p>";
  }
}

/**
 * Create pending FSBO seller contracts if missing (idempotent).
 */
export async function ensureSellerContractsForFsboListing(fsboListingId: string): Promise<void> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { ownerId: true, tenantId: true, listingDealType: true },
  });
  if (!listing) throw new Error("listing_not_found");

  const required = getFsboRequiredContractTypes(listing.listingDealType);

  for (const type of required) {
    const existing = await prisma.contract.findFirst({
      where: { fsboListingId, type },
    });
    if (existing) continue;

    await prisma.contract.create({
      data: {
        type,
        userId: listing.ownerId,
        tenantId: listing.tenantId,
        fsboListingId,
        status: "pending",
        title: titleForType(type),
        contentHtml: htmlForType(type),
        version: FSBO_TEMPLATE_VERSION,
        hub: "realestate",
      },
    });
  }
}

export async function assertFsboContractsSignedForActivation(
  fsboListingId: string
): Promise<{ ok: true } | { ok: false; code: "missing" | "unsigned" | "rejected" }> {
  /** Never skip in production — demo/staging must exercise real signing. */
  if (
    process.env.FSBO_SKIP_CONTRACT_ENFORCEMENT === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return { ok: true };
  }

  await ensureSellerContractsForFsboListing(fsboListingId);

  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { listingDealType: true },
  });
  const required = getFsboRequiredContractTypes(listing?.listingDealType);

  const rows = await prisma.contract.findMany({
    where: {
      fsboListingId,
      type: { in: [...required] },
    },
  });

  if (rows.length < required.length) {
    return { ok: false, code: "missing" };
  }

  const allSigned = rows.every((c) => c.status === "signed" && c.signedAt);
  if (!allSigned) {
    const rejected = rows.some((c) => c.status === "rejected");
    return { ok: false, code: rejected ? "rejected" : "unsigned" };
  }

  return { ok: true };
}

const MARKETPLACE_SIGN_TYPES = new Set<string>(Object.values(MARKETPLACE_CONTRACT_TYPES));

export async function signMarketplaceContract(params: {
  contractId: string;
  userId: string;
  ipAddress?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await prisma.contract.findFirst({
    where: { id: params.contractId, userId: params.userId },
  });
  if (!c) return { ok: false, error: "Contract not found" };
  if (!MARKETPLACE_SIGN_TYPES.has(c.type)) {
    return { ok: false, error: "Contract type cannot be signed via this flow" };
  }
  if (
    !contractEnforcementDisabled() &&
    c.type === MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT &&
    c.listingId &&
    c.hub === "bnhub"
  ) {
    const gate = await assertSellerAgreementTemplateAnswers(c.listingId);
    if (!gate.ok) {
      return { ok: false, error: gate.reasons[0] ?? "Complete required template fields before signing" };
    }
  }
  if (c.status === "signed") return { ok: true };
  if (c.status === "rejected") return { ok: false, error: "Contract was rejected" };

  const signedAt = new Date();
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  });

  await prisma.$transaction([
    prisma.contract.update({
      where: { id: c.id },
      data: { status: "signed", signedAt },
    }),
    prisma.contractSignature.create({
      data: {
        contractId: c.id,
        userId: params.userId,
        name: user?.name?.trim() || "Signer",
        email: user?.email?.trim() || "unknown@platform.local",
        role: "signer",
        signedAt,
        ipAddress: params.ipAddress && params.ipAddress !== "anonymous" ? params.ipAddress : null,
      },
    }),
  ]);

  void recordPlatformEvent({
    eventType: "contract_signed",
    sourceModule: "contracts",
    entityType: "CONTRACT",
    entityId: c.id,
    payload: { type: c.type, fsboListingId: c.fsboListingId, listingId: c.listingId },
  }).catch(() => {});

  return { ok: true };
}

export async function rejectMarketplaceContract(params: {
  contractId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await prisma.contract.findFirst({
    where: { id: params.contractId, userId: params.userId },
  });
  if (!c) return { ok: false, error: "Contract not found" };

  await prisma.contract.update({
    where: { id: c.id },
    data: { status: "rejected", signedAt: null },
  });
  return { ok: true };
}
