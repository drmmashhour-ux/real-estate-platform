import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";
import { seedStandardConditionsForOffer } from "@/modules/capital/financing-conditions.service";

const TAG = "[lender-offer]";

export async function createFinancingOffer(options: {
  pipelineDealId: string;
  actorUserId: string;
  offerName: string;
  lenderId?: string | null;
  principalAmount?: number | null;
  interestType?: string | null;
  interestRateText?: string | null;
  amortizationText?: string | null;
  termText?: string | null;
  feesText?: string | null;
  recourseType?: string | null;
  covenantSummary?: string | null;
  strengthsJson?: unknown;
  risksJson?: unknown;
  assumptionsJson?: unknown;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineFinancingOffer.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      lenderId: options.lenderId ?? null,
      offerName: options.offerName,
      principalAmount: options.principalAmount ?? null,
      interestType: options.interestType ?? null,
      interestRateText: options.interestRateText ?? null,
      amortizationText: options.amortizationText ?? null,
      termText: options.termText ?? null,
      feesText: options.feesText ?? null,
      recourseType: options.recourseType ?? null,
      covenantSummary: options.covenantSummary ?? null,
      strengthsJson: options.strengthsJson ?? undefined,
      risksJson: options.risksJson ?? undefined,
      assumptionsJson: options.assumptionsJson ?? undefined,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "OFFER_ADDED",
    note: options.offerName,
    metadataJson: { offerId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, offerId: row.id });
  return row;
}

export async function selectFinancingOffer(options: {
  pipelineDealId: string;
  offerId: string;
  actorUserId: string;
  seedStandardConditions?: boolean;
}): Promise<void> {
  const offer = await prisma.investmentPipelineFinancingOffer.findFirst({
    where: { id: options.offerId, pipelineDealId: options.pipelineDealId },
    select: { id: true },
  });
  if (!offer) throw new Error("Offer not found");

  await prisma.$transaction([
    prisma.investmentPipelineFinancingOffer.updateMany({
      where: { pipelineDealId: options.pipelineDealId, status: "SELECTED" },
      data: { status: "ACTIVE", updatedAt: new Date() },
    }),
    prisma.investmentPipelineFinancingOffer.update({
      where: { id: offer.id },
      data: { status: "SELECTED", updatedAt: new Date() },
    }),
  ]);

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "OFFER_SELECTED",
    note: options.offerId,
    metadataJson: {},
  });

  if (options.seedStandardConditions !== false) {
    const existing = await prisma.investmentPipelineFinancingCondition.count({
      where: { pipelineDealId: options.pipelineDealId, offerId: options.offerId },
    });
    if (existing === 0) {
      await seedStandardConditionsForOffer({
        pipelineDealId: options.pipelineDealId,
        offerId: options.offerId,
        actorUserId: options.actorUserId,
      });
    }
  }

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, selected: options.offerId });
}
