import { prisma } from "@/lib/db";
import { validateRequiredFields, type AnswersRecord } from "@/modules/contracts/templates";
import { resolveSellerAgreementDefinition } from "@/lib/contracts/bnhub-seller-listing-contracts";
import { MARKETPLACE_CONTRACT_TYPES } from "@/lib/contracts/marketplace-contract-types";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";

/**
 * Ensure all required dynamic fields for the active SELLER_AGREEMENT template are present.
 */
export async function assertSellerAgreementTemplateAnswers(
  listingId: string
): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  if (contractEnforcementDisabled()) return { ok: true };
  const def = await resolveSellerAgreementDefinition();
  if (!def?.fields?.length) return { ok: true };

  const row = await prisma.listingTemplateAnswers.findUnique({
    where: { listingId },
  });
  const raw = row?.answers;
  const answers: AnswersRecord =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as AnswersRecord) : {};

  const result = validateRequiredFields(def, answers);
  if (!result.ok) {
    return {
      ok: false,
      reasons: [
        `Complete required fields for the seller agreement template: ${result.missing.join(", ")}`,
      ],
    };
  }
  return { ok: true };
}

/** When saving answers, default contract type to SELLER_AGREEMENT for BNHUB listing flow. */
export const BNHUB_LISTING_TEMPLATE_CONTRACT_TYPE = MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT;
