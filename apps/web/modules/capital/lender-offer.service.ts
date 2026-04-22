import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { transitionPipelineStage } from "@/modules/deals/deal-stage.service";
import type { OfferComparisonRow } from "./capital.types";
import { generateConditionsFromOfferTx } from "./financing-conditions.service";
import { logDealCapitalTimeline } from "./capital-timeline.service";
import { updateLenderStatus } from "./lender.service";

const TAG = "[capital.lender-offer]";

function scoreOffer(o: {
  offeredAmount: number;
  interestRate: number;
  termYears: number | null;
}): number {
  const amountTerm = o.offeredAmount * (o.termYears ?? 25);
  const ratePenalty = o.interestRate * 1_000_000;
  return amountTerm - ratePenalty;
}

export async function addOffer(
  dealId: string,
  lenderId: string,
  data: {
    offeredAmount: number;
    interestRate: number;
    amortizationYears?: number | null;
    termYears?: number | null;
    conditionsJson?: Prisma.InputJsonValue | null;
  },
  actorUserId: string | null
) {
  const lender = await prisma.lecipmPipelineDealLender.findFirst({
    where: { id: lenderId, dealId },
  });
  if (!lender) throw new Error("Lender not found for this deal");
  if (lender.status === "REJECTED" || lender.status === "SELECTED") {
    throw new Error("Cannot add offer to a closed lender row");
  }

  const offer = await prisma.lecipmPipelineDealLenderOffer.create({
    data: {
      dealId,
      lenderId,
      offeredAmount: data.offeredAmount,
      interestRate: data.interestRate,
      amortizationYears: data.amortizationYears ?? undefined,
      termYears: data.termYears ?? undefined,
      conditionsJson: data.conditionsJson ?? undefined,
      status: "RECEIVED",
    },
  });

  await updateLenderStatus(lenderId, "OFFER_RECEIVED", actorUserId);

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "OFFER_RECEIVED",
    actorUserId,
    summary: `Offer received: ${lender.lenderName} @ ${data.interestRate}%`,
    metadataJson: { offerId: offer.id, lenderId },
  });
  await logDealCapitalTimeline(dealId, "OFFER_RECEIVED", `Offer from ${lender.lenderName}`);

  logInfo(TAG, { offerId: offer.id });
  return offer;
}

export async function listOffersForDeal(dealId: string) {
  return prisma.lecipmPipelineDealLenderOffer.findMany({
    where: { dealId },
    include: { lender: { select: { id: true, lenderName: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function compareOffers(dealId: string, actorUserId: string | null) {
  const offers = await prisma.lecipmPipelineDealLenderOffer.findMany({
    where: { dealId, status: { in: ["RECEIVED", "NEGOTIATING"] } },
    include: { lender: true },
  });
  if (offers.length < 2) {
    throw new Error("At least two active offers are required before comparison");
  }

  const rows: OfferComparisonRow[] = offers.map((o) => ({
    offerId: o.id,
    lenderId: o.lenderId,
    lenderName: o.lender.lenderName,
    offeredAmount: o.offeredAmount,
    interestRate: o.interestRate,
    termYears: o.termYears,
    amortizationYears: o.amortizationYears,
    score: scoreOffer(o),
  }));

  rows.sort((a, b) => b.score - a.score);

  await prisma.lecipmPipelineDeal.update({
    where: { id: dealId },
    data: { lastOfferComparedAt: new Date() },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "OFFERS_COMPARED",
    actorUserId,
    summary: `Compared ${offers.length} offers`,
    metadataJson: { order: rows.map((r) => r.offerId) },
  });

  logInfo(TAG, { dealId, compared: offers.length });
  return { comparedAt: new Date().toISOString(), rows };
}

export async function selectOffer(offerId: string, actorUserId: string | null) {
  const offer = await prisma.lecipmPipelineDealLenderOffer.findUnique({
    where: { id: offerId },
    include: { lender: true, deal: true },
  });
  if (!offer) throw new Error("Offer not found");
  if (!offer.deal.lastOfferComparedAt) {
    throw new Error("Run offer comparison before selecting (guardrail)");
  }

  await prisma.$transaction(async (tx) => {
    const dealRow = await tx.lecipmPipelineDeal.findUnique({ where: { id: offer.dealId } });
    if (!dealRow) throw new Error("Deal not found");

    await tx.lecipmPipelineDealLenderOffer.updateMany({
      where: { dealId: offer.dealId, id: { not: offerId }, status: { not: "REJECTED" } },
      data: { status: "REJECTED" },
    });
    await tx.lecipmPipelineDealLenderOffer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    });

    await tx.lecipmPipelineDealLender.update({
      where: { id: offer.lenderId },
      data: { status: "SELECTED" },
    });
    await tx.lecipmPipelineDealLender.updateMany({
      where: { dealId: offer.dealId, id: { not: offer.lenderId } },
      data: { status: "REJECTED" },
    });

    await generateConditionsFromOfferTx(tx, offerId, actorUserId);

    await appendDealAuditEvent(tx, {
      dealId: offer.dealId,
      eventType: "OFFER_SELECTED",
      actorUserId,
      summary: `Selected offer ${offerId} (${offer.lender.lenderName})`,
      metadataJson: { offerId, lenderId: offer.lenderId },
    });
  });

  await transitionPipelineStage({
    dealId: offer.dealId,
    toStage: "EXECUTION",
    actorUserId,
    reason: "Lender offer selected — moving to execution",
  });

  await logDealCapitalTimeline(offer.dealId, "OFFER_SELECTED", `Offer ${offerId} selected (${offer.lender.lenderName})`);

  logInfo(TAG, { offerId, dealId: offer.dealId });
  return prisma.lecipmPipelineDealLenderOffer.findUnique({
    where: { id: offerId },
    include: { lender: true },
  });
}
