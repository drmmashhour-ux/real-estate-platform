import { prisma } from "@/lib/db";
import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import { NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-broker-collaboration-agreement";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";

const T = MARKETPLACE_CONTRACT_TYPES.BROKER_AGREEMENT;
const VERSION = "2025-03-22";

/**
 * One broker mandate contract per user (not listing-scoped).
 */
export async function ensureBrokerAgreementContract(userId: string): Promise<void> {
  const existing = await prisma.contract.findFirst({
    where: { userId, type: T, fsboListingId: null, listingId: null, bookingId: null },
  });
  if (existing) return;

  await prisma.contract.create({
    data: {
      type: T,
      userId,
      status: "pending",
      title: "BNHUB broker collaboration & commission agreement",
      contentHtml: NBHUB_BROKER_COLLABORATION_AGREEMENT_HTML,
      version: VERSION,
      hub: "broker",
    },
  });
}

export async function assertBrokerAgreementSigned(
  userId: string
): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  if (contractEnforcementDisabled()) return { ok: true };

  await ensureBrokerAgreementContract(userId);

  const row = await prisma.contract.findFirst({
    where: { userId, type: T, fsboListingId: null, listingId: null, bookingId: null },
  });
  if (!row) {
    return { ok: false, reasons: ["Broker agreement not found"] };
  }
  if (row.status === "rejected") {
    return { ok: false, reasons: ["Broker agreement was rejected"] };
  }
  if (row.status !== "signed" || !row.signedAt) {
    return {
      ok: false,
      reasons: ["Sign the broker agreement before continuing (Dashboard → Contracts)."],
    };
  }
  return { ok: true };
}
