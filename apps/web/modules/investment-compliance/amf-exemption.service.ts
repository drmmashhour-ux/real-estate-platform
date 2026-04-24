import type { AmfExemptionCategory } from "@prisma/client";
import { prisma } from "@repo/db";
import { logInvestmentComplianceTagged } from "@/lib/server/launch-logger";
import { generateFullLegalPack } from "@/modules/legal-pack";

/** Illustrative reporting horizon — confirm with Québec securities counsel for each distribution. */
export const EXEMPT_FILING_DEADLINE_DAYS_AFTER_DISTRIBUTION = 10;

const ENABLED_BY_DEFAULT: AmfExemptionCategory[] = ["ACCREDITED_INVESTOR", "FAMILY_FRIENDS_BUSINESS_ASSOCIATES"];

export function computeExemptDistributionFilingDeadline(distributionDate: Date): Date {
  const d = new Date(distributionDate.getTime());
  d.setUTCDate(d.getUTCDate() + EXEMPT_FILING_DEADLINE_DAYS_AFTER_DISTRIBUTION);
  return d;
}

export class AmfExemptionWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmfExemptionWorkflowError";
  }
}

function counselAllows(category: AmfExemptionCategory, counselJson: unknown): boolean {
  if (ENABLED_BY_DEFAULT.includes(category)) return true;
  if (!counselJson || typeof counselJson !== "object") return false;
  const keys = (counselJson as { enabled?: string[] }).enabled;
  return Array.isArray(keys) && keys.includes(category);
}

export async function assertInvestorEligibleForExemption(params: {
  investorUserId: string;
  exemption: AmfExemptionCategory;
  counselJson?: unknown;
}): Promise<void> {
  if (!counselAllows(params.exemption, params.counselJson)) {
    logInvestmentComplianceTagged.warn("investor_blocked_not_eligible", {
      investorUserId: params.investorUserId,
      reason: "exemption_not_enabled_by_counsel",
      exemption: params.exemption,
    });
    throw new AmfExemptionWorkflowError("This exemption path is disabled until counsel enables it on the SPV record.");
  }

  const profile = await prisma.amfInvestor.findFirst({
    where: { userId: params.investorUserId },
    select: { accreditationStatus: true, suitabilityIntakeJson: true },
  });

  if (params.exemption === "ACCREDITED_INVESTOR") {
    const ok =
      profile?.accreditationStatus === "ACCREDITED" ||
      (typeof profile?.suitabilityIntakeJson === "object" &&
        profile?.suitabilityIntakeJson !== null &&
        (profile.suitabilityIntakeJson as { accredited?: boolean }).accredited === true);
    if (!ok) {
      logInvestmentComplianceTagged.warn("investor_blocked_not_eligible", {
        investorUserId: params.investorUserId,
        exemption: params.exemption,
        reason: "accreditation_not_recorded",
      });
      throw new AmfExemptionWorkflowError(
        "Investor eligibility not recorded for accredited path — no automated acceptance of non-qualified investors.",
      );
    }
    return;
  }

  if (params.exemption === "FAMILY_FRIENDS_BUSINESS_ASSOCIATES") {
    const json = profile?.suitabilityIntakeJson as { ffbaRelationshipConfirmed?: boolean } | null | undefined;
    if (!json?.ffbaRelationshipConfirmed) {
      logInvestmentComplianceTagged.warn("investor_blocked_not_eligible", {
        investorUserId: params.investorUserId,
        exemption: params.exemption,
        reason: "ffba_not_confirmed",
      });
      throw new AmfExemptionWorkflowError("FFBA relationship confirmation missing — investor cannot proceed without eligibility recorded.");
    }
  }
}

export async function chooseExemptionForSpv(params: {
  spvId: string;
  exemption: AmfExemptionCategory;
}): Promise<void> {
  const spv = await prisma.amfSpv.findUnique({
    where: { id: params.spvId },
    include: { capitalDeal: { select: { allowsPublicMarketing: true, solicitationMode: true } } },
  });
  if (!spv) throw new AmfExemptionWorkflowError("SPV not found.");
  if (spv.capitalDeal?.allowsPublicMarketing) {
    throw new AmfExemptionWorkflowError("Public marketing flag is on — private exempt workflow blocked pending sponsor review.");
  }
  if (!counselAllows(params.exemption, spv.counselApprovedExemptionsJson)) {
    throw new AmfExemptionWorkflowError("Exemption not permitted for this SPV.");
  }

  await prisma.amfSpv.update({
    where: { id: params.spvId },
    data: {
      exemptionPath: params.exemption,
      privateExemptDealMode: true,
    },
  });

  logInvestmentComplianceTagged.info("exemption_selected", { spvId: params.spvId, exemption: params.exemption });
}

export async function createOrRefreshExemptDistributionFile(params: {
  spvId: string;
  exemption: AmfExemptionCategory;
  distributionDate: Date;
}): Promise<{ id: string; filingDeadline: Date }> {
  const filingDeadline = computeExemptDistributionFilingDeadline(params.distributionDate);
  const row = await prisma.exemptDistributionFile.create({
    data: {
      spvId: params.spvId,
      exemptionType: params.exemption,
      distributionDate: params.distributionDate,
      filingDeadline,
      form45106F1Status: "DRAFT",
    },
  });
  logInvestmentComplianceTagged.info("form_45_106f1_ready", {
    spvId: params.spvId,
    exemptFileId: row.id,
    filingDeadline: filingDeadline.toISOString(),
  });
  return { id: row.id, filingDeadline };
}

export async function markForm45106Filed(exemptFileId: string): Promise<void> {
  await prisma.exemptDistributionFile.update({
    where: { id: exemptFileId },
    data: { form45106F1Status: "FILED" },
  });
  logInvestmentComplianceTagged.info("form_45_106f1_filed", { exemptFileId });
}

export async function generateLegalPackForSpv(params: {
  spvId: string;
  capitalDealId: string;
  exemption: AmfExemptionCategory;
}): Promise<ReturnType<typeof generateFullLegalPack>> {
  const pack = generateFullLegalPack({
    spvIssuerName: `SPV issuer (${params.spvId.slice(0, 8)}…)`,
    dealSummary: "Private exempt placement — summary to be completed by issuer counsel.",
    exemption: params.exemption,
  });

  logInvestmentComplianceTagged.info("legal_pack_generated", {
    spvId: params.spvId,
    capitalDealId: params.capitalDealId,
    version: pack.version,
  });

  return pack;
}
