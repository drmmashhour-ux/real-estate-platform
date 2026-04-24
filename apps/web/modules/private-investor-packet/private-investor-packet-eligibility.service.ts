import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type EligibilityResult =
  | { ok: true }
  | { ok: false; blockers: string[] };

/**
 * Pre-flight for private packet preparation — no automatic sending; block with clear reasons.
 */
export async function assertPrivateInvestorPacketEligibility(input: {
  dealId: string;
  investorUserId: string;
  spvId?: string | null;
}): Promise<EligibilityResult> {
  const blockers: string[] = [];

  const user = await prisma.user.findUnique({
    where: { id: input.investorUserId },
    select: { id: true, accountStatus: true, email: true },
  });
  if (!user) {
    blockers.push("Investor account not found.");
    return { ok: false, blockers };
  }
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    blockers.push("Investor account is not ACTIVE.");
  }

  const amf = await prisma.amfInvestor.findFirst({
    where: { userId: input.investorUserId },
    select: {
      id: true,
      kycStatus: true,
      accreditationStatus: true,
      suitabilityIntakeJson: true,
    },
  });
  if (!amf) {
    blockers.push("AMF investor profile not linked — complete investor onboarding.");
  } else {
    if (amf.kycStatus !== "VERIFIED") {
      blockers.push(`KYC must be VERIFIED (current: ${amf.kycStatus}).`);
    }
    const acc = amf.accreditationStatus;
    if (acc !== "ACCREDITED" && acc !== "EXEMPT") {
      blockers.push(`Accreditation must be ACCREDITED or EXEMPT for private placement (current: ${acc}).`);
    }
    const suit = amf.suitabilityIntakeJson;
    if (suit == null || (typeof suit === "object" && suit !== null && Object.keys(suit as object).length === 0)) {
      blockers.push("Investor suitability / eligibility questionnaire not completed.");
    }
  }

  if (input.spvId) {
    const spv = await prisma.amfSpv.findUnique({
      where: { id: input.spvId },
      select: { id: true, exemptionPath: true, capitalDeal: { select: { listingId: true } } },
    });
    if (!spv) {
      blockers.push("SPV not found.");
    } else if (!spv.exemptionPath) {
      blockers.push("SPV exemption path not configured — select exemption category before packet prep.");
    }

    const deal = await prisma.deal.findUnique({
      where: { id: input.dealId },
      select: { listingId: true },
    });
    if (deal?.listingId && spv?.capitalDeal?.listingId && deal.listingId !== spv.capitalDeal.listingId) {
      blockers.push("Selected SPV does not align with this deal listing — verify capital structure.");
    }
  }

  const dealRow = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { listingId: true },
  });
  const capitalDeal =
    dealRow?.listingId ?
      await prisma.amfCapitalDeal.findFirst({
        where: { listingId: dealRow.listingId },
        select: { id: true },
      })
    : null;
  if (capitalDeal && amf) {
    const disclosureCount = await prisma.amfDealDisclosure.count({
      where: { capitalDealId: capitalDeal.id },
    });
    if (disclosureCount > 0) {
      const ackCount = await prisma.amfDisclosureAcknowledgment.count({
        where: { capitalDealId: capitalDeal.id, investorId: amf.id },
      });
      if (ackCount < disclosureCount) {
        blockers.push("Investor has not acknowledged all required deal disclosures for this offering.");
      }
    }
  }

  if (blockers.length) return { ok: false, blockers };
  return { ok: true };
}
