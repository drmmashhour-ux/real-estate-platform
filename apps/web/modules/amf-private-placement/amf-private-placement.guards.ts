import type { CrmDealInvestorCommitment } from "@prisma/client";

/**
 * Securities-side guard: SPV-linked subscriptions must record a prospectus-exemption classification
 * before subscription signing or capital receipt (brokerage does not "sell" the security).
 */
export function assertCommitmentExemptionRecordedForSpv(
  commitment: Pick<CrmDealInvestorCommitment, "spvId" | "exemptionRecordedAt" | "exemptionType">,
) {
  if (!commitment.spvId) return;
  if (!commitment.exemptionRecordedAt || !commitment.exemptionType) {
    throw new Error("EXEMPTION_CLASSIFICATION_REQUIRED");
  }
}
