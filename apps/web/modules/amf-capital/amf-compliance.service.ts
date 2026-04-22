import type { AmfCapitalDeal, AmfInvestor } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AMF_SOLICITATION_PRIVATE,
  REQUIRED_SUBSCRIPTION_DISCLOSURES,
} from "./amf.constants";

export type ComplianceFailure = { ok: false; code: string; message: string };
export type ComplianceOk = { ok: true };
export type ComplianceResult = ComplianceOk | ComplianceFailure;

function fail(code: string, message: string): ComplianceFailure {
  return { ok: false, code, message };
}

/** KYC + accreditation gates before capital commitment. */
export function assessInvestorEligibility(investor: AmfInvestor): ComplianceResult {
  if (investor.kycStatus !== "VERIFIED") {
    return fail("KYC_REQUIRED", "Investor KYC must be VERIFIED before subscribing.");
  }

  const acc = investor.accreditationStatus;
  if (acc === "NOT_ACCREDITED") {
    return fail("NOT_ACCREDITED", "Investor is marked NOT_ACCREDITED.");
  }
  if (acc === "PENDING") {
    return fail("ACCREDITATION_PENDING", "Accreditation review must complete before subscribing.");
  }

  if (acc !== "ACCREDITED" && acc !== "EXEMPT") {
    return fail("ACCREDITATION_UNKNOWN", "Unsupported accreditation status.");
  }

  return { ok: true };
}

/** Blocks broad marketing flows unless issuer enables compliance hooks. */
export function assertMarketingAllowed(deal: AmfCapitalDeal): ComplianceResult {
  if (!deal.allowsPublicMarketing) {
    return { ok: true };
  }
  if (!deal.exemptionNarrative || deal.exemptionNarrative.trim().length === 0) {
    return fail(
      "MARKETING_EXEMPTION_MISSING",
      "Public marketing requires a recorded exemption / prospectus narrative (issuer legal review)."
    );
  }
  return { ok: true };
}

/**
 * Private placement: unverified investors cannot subscribe (redundant with KYC but explicit).
 */
export function assertPrivatePlacement(deal: AmfCapitalDeal, investor: AmfInvestor): ComplianceResult {
  if (deal.solicitationMode !== AMF_SOLICITATION_PRIVATE) {
    return { ok: true };
  }
  return assessInvestorEligibility(investor);
}

/** Ensures minimum disclosure pack exists before CONFIRMED investments. */
export async function assertDisclosuresCompleteForDeal(capitalDealId: string): Promise<ComplianceResult> {
  const rows = await prisma.amfDealDisclosure.findMany({
    where: { capitalDealId },
    select: { docType: true },
  });
  const types = new Set(rows.map((r) => r.docType));
  for (const req of REQUIRED_SUBSCRIPTION_DISCLOSURES) {
    if (!types.has(req)) {
      return fail("DISCLOSURE_MISSING", `Deal is missing required disclosure type: ${req}`);
    }
  }
  return { ok: true };
}

export async function assertInvestorAcknowledgedAllRequired(
  capitalDealId: string,
  investorId: string
): Promise<ComplianceResult> {
  const disclosures = await prisma.amfDealDisclosure.findMany({
    where: { capitalDealId, docType: { in: [...REQUIRED_SUBSCRIPTION_DISCLOSURES] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, docType: true },
  });
  const latestByType = new Map<string, string>();
  for (const d of disclosures) {
    if (!latestByType.has(d.docType)) latestByType.set(d.docType, d.id);
  }
  for (const req of REQUIRED_SUBSCRIPTION_DISCLOSURES) {
    if (!latestByType.has(req)) {
      return fail("DISCLOSURE_MISSING", "Required disclosures are not all published for this deal.");
    }
  }

  const ids = [...latestByType.values()];
  const acks = await prisma.amfDisclosureAcknowledgment.findMany({
    where: { capitalDealId, investorId, disclosureId: { in: ids } },
    select: { disclosureId: true },
  });
  const ackSet = new Set(acks.map((a) => a.disclosureId));
  for (const id of ids) {
    if (!ackSet.has(id)) {
      return fail("DISCLOSURE_NOT_ACKNOWLEDGED", "Investor must acknowledge all required disclosure documents.");
    }
  }
  return { ok: true };
}

export async function assertDealOpenForInvestment(deal: AmfCapitalDeal): Promise<ComplianceResult> {
  if (deal.status !== "OPEN") {
    return fail("DEAL_NOT_OPEN", "Capital deal must be OPEN to subscribe.");
  }
  return { ok: true };
}
