import type { AmfExemptionCategory } from "@prisma/client";
import { ExemptFilingFormStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { recordInvestmentFlowAudit } from "@/modules/investment-flow/investment-flow-audit.service";
import {
  assertNoGuaranteeLanguageInPayload,
  buildDefaultDocumentChecklistJson,
  DEFAULT_AMF_EXEMPT_DISTRIBUTION_FEE_CAD,
  DEFAULT_ENABLED_EXEMPTIONS,
  DEFAULT_FILING_DEADLINE_OFFSET_DAYS,
} from "./amf-private-placement.constants";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function isExemptionAllowedForSpv(
  spv: { counselApprovedExemptionsJson: unknown },
  exemption: AmfExemptionCategory,
): boolean {
  if (DEFAULT_ENABLED_EXEMPTIONS.includes(exemption)) return true;
  const raw = spv.counselApprovedExemptionsJson;
  if (!raw || !Array.isArray(raw)) return false;
  return raw.includes(exemption);
}

export async function createPrivatePlacementSpv(input: {
  dealId: string;
  issuerLegalName: string;
  actorUserId: string;
  actorRole: PlatformRole;
  counselApprovedRealMode?: boolean;
}) {
  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { id: true, brokerId: true, listingId: true, dealCode: true },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  if (input.actorRole !== PlatformRole.ADMIN && deal.brokerId !== input.actorUserId) {
    throw new Error("BROKER_DEAL_ACCESS_REQUIRED");
  }

  const existing = await prisma.amfSpv.findFirst({ where: { dealId: input.dealId }, select: { id: true } });
  if (existing) throw new Error("SPV_ALREADY_EXISTS_FOR_DEAL");

  const title = `Private placement · ${deal.dealCode ?? deal.id.slice(0, 8)}`;

  const capitalDeal = await prisma.amfCapitalDeal.create({
    data: {
      listingId: deal.listingId,
      sponsorUserId: deal.brokerId,
      title,
      status: "DRAFT",
      solicitationMode: "PRIVATE_PLACEMENT",
      allowsPublicMarketing: false,
      exemptionNarrative:
        "Prospectus-exempt private placement — simulation-first unless counsel-approved real mode is enabled on the SPV.",
    },
  });

  const entity = await prisma.lecipmLegalEntity.create({
    data: {
      name: input.issuerLegalName,
      type: "FUND",
      jurisdiction: "QC",
      regulator: "AMF",
      capitalDealId: capitalDeal.id,
    },
  });

  const spv = await prisma.amfSpv.create({
    data: {
      capitalDealId: capitalDeal.id,
      entityId: entity.id,
      dealId: deal.id,
      issuerLegalName: input.issuerLegalName,
      issuerType: "SPV",
      active: true,
      privateExemptDealMode: true,
      counselApprovedRealMode: input.counselApprovedRealMode === true,
    },
  });

  await recordInvestmentFlowAudit({
    dealId: deal.id,
    actorUserId: input.actorUserId,
    action: "amf_private_placement_spv_created",
    entityType: "AmfSpv",
    entityId: spv.id,
    metadata: { capitalDealId: capitalDeal.id, simulationFirst: !spv.counselApprovedRealMode },
  });

  return spv;
}

export async function setExemptDistributionForSpv(input: {
  spvId: string;
  exemptionType: AmfExemptionCategory;
  distributionDate: Date;
  notes?: string | null;
  actorUserId: string;
  actorRole: PlatformRole;
}) {
  const spv = await prisma.amfSpv.findUnique({
    where: { id: input.spvId },
    include: { deal: { select: { id: true, brokerId: true } }, capitalDeal: { select: { id: true } } },
  });
  if (!spv?.dealId) throw new Error("SPV_DEAL_NOT_LINKED");
  if (input.actorRole !== PlatformRole.ADMIN && spv.deal?.brokerId !== input.actorUserId) {
    throw new Error("BROKER_DEAL_ACCESS_REQUIRED");
  }
  if (!isExemptionAllowedForSpv(spv, input.exemptionType)) {
    throw new Error("EXEMPTION_NOT_ENABLED_FOR_SPV");
  }

  const filingDeadline = addDays(input.distributionDate, DEFAULT_FILING_DEADLINE_OFFSET_DAYS);
  const checklist = buildDefaultDocumentChecklistJson();

  const row = await prisma.$transaction(async (tx) => {
    await tx.amfSpv.update({
      where: { id: spv.id },
      data: { exemptionPath: input.exemptionType },
    });

    const dist = await tx.exemptDistributionFile.create({
      data: {
        spvId: spv.id,
        exemptionType: input.exemptionType,
        distributionDate: input.distributionDate,
        filingDeadline,
        form45106F1Status: ExemptFilingFormStatus.DRAFT,
        amfFeeAmount: DEFAULT_AMF_EXEMPT_DISTRIBUTION_FEE_CAD,
        notesJson: input.notes?.trim() ? asInputJsonValue({ text: input.notes.trim() }) : undefined,
        documentChecklistJson: asInputJsonValue(checklist),
      },
    });

    if (spv.deal?.brokerId) {
      await tx.lecipmBrokerTask.create({
        data: {
          brokerId: spv.deal.brokerId,
          dealId: spv.dealId,
          taskType: "amf_exempt_distribution_45_106",
          title: "File Form 45-106F1 (exempt distribution) — counsel review",
          dueAt: filingDeadline,
          priority: "high",
          metadata: asInputJsonValue({
            spvId: spv.id,
            exemptDistributionFileId: dist.id,
            note: "Simulation-first — confirm filing package with qualified counsel before real mode.",
          }),
        },
      });
      await tx.lecipmBrokerTask.create({
        data: {
          brokerId: spv.deal.brokerId,
          dealId: spv.dealId,
          taskType: "amf_exempt_distribution_fee",
          title: `AMF exempt distribution fee (min. $${DEFAULT_AMF_EXEMPT_DISTRIBUTION_FEE_CAD} CAD — verify)`,
          dueAt: filingDeadline,
          priority: "high",
          metadata: asInputJsonValue({ spvId: spv.id, exemptDistributionFileId: dist.id }),
        },
      });
    }

    return dist;
  });

  await recordInvestmentFlowAudit({
    dealId: spv.dealId,
    actorUserId: input.actorUserId,
    action: "amf_exempt_distribution_configured",
    entityType: "ExemptDistributionFile",
    entityId: row.id,
    metadata: { exemptionType: input.exemptionType, filingDeadline: filingDeadline.toISOString() },
  });

  return row;
}

export async function markForm45106Status(input: {
  spvId: string;
  status: "READY" | "FILED";
  actorUserId: string;
  actorRole: PlatformRole;
}) {
  const spv = await prisma.amfSpv.findUnique({
    where: { id: input.spvId },
    include: { deal: { select: { id: true, brokerId: true } } },
  });
  if (!spv?.dealId) throw new Error("SPV_NOT_FOUND");
  if (input.actorRole !== PlatformRole.ADMIN && spv.deal?.brokerId !== input.actorUserId) {
    throw new Error("BROKER_DEAL_ACCESS_REQUIRED");
  }

  const latest = await prisma.exemptDistributionFile.findFirst({
    where: { spvId: spv.id },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) throw new Error("EXEMPT_DISTRIBUTION_NOT_FOUND");

  const next =
    input.status === "FILED" ? ExemptFilingFormStatus.FILED
    : ExemptFilingFormStatus.READY;

  const updated = await prisma.exemptDistributionFile.update({
    where: { id: latest.id },
    data: { form45106F1Status: next },
  });

  await recordInvestmentFlowAudit({
    dealId: spv.dealId,
    actorUserId: input.actorUserId,
    action: input.status === "FILED" ? "amf_form_45_106_filed" : "amf_form_45_106_ready",
    entityType: "ExemptDistributionFile",
    entityId: updated.id,
    metadata: { status: next },
  });

  return updated;
}

export async function classifyInvestorForPrivatePlacement(input: {
  spvId: string;
  investorUserId: string;
  exemptionType: AmfExemptionCategory;
  jurisdiction: string;
  questionnaireJson: Record<string, unknown>;
  actorUserId: string;
  actorRole: PlatformRole;
}) {
  assertNoGuaranteeLanguageInPayload(input.questionnaireJson);

  const spv = await prisma.amfSpv.findUnique({
    where: { id: input.spvId },
    include: {
      deal: { select: { id: true, brokerId: true } },
      exemptDistributionFiles: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!spv?.dealId) throw new Error("SPV_NOT_FOUND");
  if (input.actorRole !== PlatformRole.ADMIN && spv.deal?.brokerId !== input.actorUserId) {
    throw new Error("BROKER_DEAL_ACCESS_REQUIRED");
  }
  if (!isExemptionAllowedForSpv(spv, input.exemptionType)) {
    throw new Error("EXEMPTION_NOT_ENABLED_FOR_SPV");
  }
  const dist = spv.exemptDistributionFiles[0];
  if (!dist) throw new Error("EXEMPT_DISTRIBUTION_REQUIRED_BEFORE_CLASSIFY");

  const profile = await prisma.investorEligibilityProfile.upsert({
    where: { userId: input.investorUserId },
    create: {
      userId: input.investorUserId,
      jurisdiction: input.jurisdiction.slice(0, 16) || "QC",
      questionnaireJson: asInputJsonValue(input.questionnaireJson),
      classifiedExemption: input.exemptionType,
      classifiedAt: new Date(),
      classifiedByUserId: input.actorUserId,
      blockedReason: null,
    },
    update: {
      jurisdiction: input.jurisdiction.slice(0, 16) || "QC",
      questionnaireJson: asInputJsonValue(input.questionnaireJson),
      classifiedExemption: input.exemptionType,
      classifiedAt: new Date(),
      classifiedByUserId: input.actorUserId,
      blockedReason: null,
    },
  });

  await prisma.investorExemptionRecord.upsert({
    where: {
      exemptDistributionFileId_investorUserId: {
        exemptDistributionFileId: dist.id,
        investorUserId: input.investorUserId,
      },
    },
    create: {
      exemptDistributionFileId: dist.id,
      investorUserId: input.investorUserId,
      exemptionType: input.exemptionType,
      classificationSnapshotJson: asInputJsonValue({
        questionnaire: input.questionnaireJson,
        profileId: profile.id,
        simulationFirst: !spv.counselApprovedRealMode,
      }),
      recordedByUserId: input.actorUserId,
    },
    update: {
      exemptionType: input.exemptionType,
      classificationSnapshotJson: asInputJsonValue({
        questionnaire: input.questionnaireJson,
        profileId: profile.id,
        simulationFirst: !spv.counselApprovedRealMode,
      }),
      recordedAt: new Date(),
      recordedByUserId: input.actorUserId,
    },
  });

  await prisma.crmDealInvestorCommitment.updateMany({
    where: { dealId: spv.dealId, investorId: input.investorUserId, spvId: spv.id },
    data: {
      exemptionType: input.exemptionType,
      exemptionRecordedAt: new Date(),
    },
  });

  await recordInvestmentFlowAudit({
    dealId: spv.dealId,
    actorUserId: input.actorUserId,
    action: "amf_investor_classified",
    entityType: "InvestorEligibilityProfile",
    entityId: profile.id,
    metadata: { investorUserId: input.investorUserId, exemptionType: input.exemptionType },
  });

  return profile;
}

export async function blockInvestorClassification(input: {
  investorUserId: string;
  reason: string;
  actorUserId: string;
}) {
  await prisma.investorEligibilityProfile.upsert({
    where: { userId: input.investorUserId },
    create: {
      userId: input.investorUserId,
      jurisdiction: "QC",
      questionnaireJson: {},
      classifiedExemption: null,
      blockedReason: input.reason.slice(0, 4000),
      classifiedAt: new Date(),
      classifiedByUserId: input.actorUserId,
    },
    update: {
      classifiedExemption: null,
      blockedReason: input.reason.slice(0, 4000),
      classifiedAt: new Date(),
      classifiedByUserId: input.actorUserId,
    },
  });
}

export async function getInvestmentComplianceSummary(input: { actorUserId: string; actorRole: PlatformRole }) {
  const dealWhere =
    input.actorRole === PlatformRole.ADMIN ? {}
    : { brokerId: input.actorUserId };

  const deals = await prisma.deal.findMany({
    where: dealWhere,
    select: { id: true, dealCode: true },
    take: 200,
  });
  const dealIds = deals.map((d) => d.id);
  if (dealIds.length === 0) {
    return { spvIssuers: [], filingQueue: [], eligibilityQueue: [] as { dealId: string; investorId: string }[] };
  }

  const spvs = await prisma.amfSpv.findMany({
    where: { dealId: { in: dealIds } },
    include: {
      deal: { select: { id: true, dealCode: true } },
      exemptDistributionFiles: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const commitmentsNeedingClass = await prisma.crmDealInvestorCommitment.findMany({
    where: {
      dealId: { in: dealIds },
      spvId: { not: null },
      exemptionRecordedAt: null,
      status: { in: ["SOFT_COMMIT", "CONFIRMED"] },
    },
    select: { dealId: true, investorId: true, spvId: true },
    take: 200,
  });

  const filingQueue = spvs.flatMap((s) =>
    s.exemptDistributionFiles
      .filter((f) => f.form45106F1Status !== "FILED")
      .map((f) => ({
        spvId: s.id,
        dealId: s.dealId,
        distributionId: f.id,
        status: f.form45106F1Status,
        filingDeadline: f.filingDeadline.toISOString(),
        amfFeeAmount: f.amfFeeAmount?.toString() ?? String(DEFAULT_AMF_EXEMPT_DISTRIBUTION_FEE_CAD),
      })),
  );

  return {
    spvIssuers: spvs.map((s) => ({
      id: s.id,
      dealId: s.dealId,
      legalName: s.issuerLegalName ?? "SPV",
      issuerType: s.issuerType,
      jurisdiction: "QC",
      active: s.active,
      counselApprovedRealMode: s.counselApprovedRealMode,
      exemptionPath: s.exemptionPath,
      dealCode: s.deal?.dealCode ?? null,
      distributions: s.exemptDistributionFiles,
    })),
    filingQueue,
    eligibilityQueue: commitmentsNeedingClass,
  };
}
