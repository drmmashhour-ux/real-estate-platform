import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { resolveListingAskCad } from "./deal.service";
import { computeNegotiationStrategies, type NegotiationAiContext } from "./negotiation-ai.engine";

async function medianFsboPeerCad(city: string, excludeListingId?: string): Promise<{ med: number | null; n: number }> {
  const rows = await prisma.fsboListing.findMany({
    where: {
      city: { equals: city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      ...(excludeListingId ? { id: { not: excludeListingId } } : {}),
    },
    select: { priceCents: true },
    take: 200,
  });
  const prices = rows
    .map((r) => r.priceCents)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (prices.length < 4) return { med: null, n: prices.length };
  const mid = Math.floor(prices.length / 2);
  const med = prices.length % 2 ? prices[mid]! : Math.round((prices[mid - 1]! + prices[mid]!) / 2);
  return { med: med / 100, n: prices.length };
}

/** Exported for deal scoring — FSBO/STL peer median ask in the same city (sample ≥ 4). */
export async function resolveComparableMedian(listingId: string | null): Promise<{ median: number | null; n: number }> {
  if (!listingId) return { median: null, n: 0 };
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { city: true },
  });
  if (fsbo?.city) {
    const { med, n } = await medianFsboPeerCad(fsbo.city, listingId);
    return { median: med, n };
  }
  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { city: true },
  });
  if (crm?.city) {
    const { med, n } = await medianFsboPeerCad(crm.city);
    return { median: med, n };
  }
  const stay = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { city: true, nightPriceCents: true },
  });
  if (stay?.city) {
    const { med, n } = await medianFsboPeerCad(stay.city);
    if (med != null) return { median: med, n };
    if (stay.nightPriceCents > 0) return { median: (stay.nightPriceCents / 100) * 30, n: 0 };
  }
  return { median: null, n: 0 };
}

export async function buildNegotiationAiContext(dealId: string): Promise<NegotiationAiContext | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      priceCents: true,
      status: true,
      crmStage: true,
      listingId: true,
      updatedAt: true,
    },
  });
  if (!deal) return null;

  const [listPriceCad, { median: comparableMedianCad, n: comparableSampleSize }, proposalCount, conditionRows, approvalCount] =
    await Promise.all([
      resolveListingAskCad(deal.listingId),
      resolveComparableMedian(deal.listingId),
      prisma.negotiationProposal.count({
        where: { round: { thread: { dealId } } },
      }),
      prisma.dealClosingCondition.findMany({
        where: { dealId },
        select: { conditionType: true, status: true },
        take: 40,
      }),
      prisma.dealExecutionApproval.count({ where: { dealId } }),
    ]);

  const now = new Date();
  const urgencyDaysSinceActivity = Math.max(0, (now.getTime() - deal.updatedAt.getTime()) / 86_400_000);

  let inspectionStress: NegotiationAiContext["inspectionStress"] = "low";
  if (deal.status === "inspection") inspectionStress = "high";
  else if (conditionRows.some((c) => /inspect|inspection|survey/i.test(c.conditionType) && c.status !== "fulfilled")) {
    inspectionStress = "medium";
  }

  let financingStrength: NegotiationAiContext["financingStrength"] = "moderate";
  if (deal.status === "financing") financingStrength = "moderate";
  if (approvalCount > 0) financingStrength = "strong";
  if (deal.status === "initiated" || deal.status === "offer_submitted") financingStrength = "weak";

  const crm = (deal.crmStage ?? "").toLowerCase();
  let buyerSellerMotivationNote = "Motivation inferred from CRM stage and file freshness.";
  if (crm.includes("hot") || crm.includes("accepted") || crm.includes("negotiation")) {
    buyerSellerMotivationNote = "Parties appear engaged — seller/buyer motivation skews favorable for a structured counter.";
  } else if (crm.includes("new") || crm.includes("lost")) {
    buyerSellerMotivationNote = "Early or cooling CRM stage — use conservative counters unless you have contrary facts.";
  }

  return {
    dealPriceCad: deal.priceCents / 100,
    listPriceCad,
    comparableMedianCad,
    comparableSampleSize,
    buyerSellerMotivationNote,
    urgencyDaysSinceActivity,
    priorOfferCount: proposalCount,
    inspectionStress,
    financingStrength,
    dealStatus: deal.status,
  };
}

export async function createNegotiationStrategiesForDeal(dealId: string) {
  const ctx = await buildNegotiationAiContext(dealId);
  if (!ctx) throw new Error("Deal not found");
  const rows = computeNegotiationStrategies(ctx);
  const strategyRunId = randomUUID();

  const created = await prisma.$transaction(
    rows.map((r) =>
      prisma.negotiationStrategy.create({
        data: {
          dealId,
          strategyRunId,
          strategyType: r.strategyType,
          suggestedPrice: r.suggestedPrice,
          conditionChangesJson: r.conditionChangesJson as object[],
          timelineSuggestion: r.timelineSuggestion,
          reasoningJson: r.reasoningJson as object,
          confidenceScore: r.confidenceScore,
          workflowStatus: "AI_PROPOSED",
        },
      }),
    ),
  );

  return { strategyRunId, strategies: sortStrategiesForDisplay(created) };
}

const ORDER = ["AGGRESSIVE", "BALANCED", "SAFE"] as const;

export function sortStrategiesForDisplay<T extends { strategyType: string }>(strategies: T[]): T[] {
  return [...strategies].sort(
    (a, b) => ORDER.indexOf(a.strategyType as (typeof ORDER)[number]) - ORDER.indexOf(b.strategyType as (typeof ORDER)[number]),
  );
}

export async function listLatestNegotiationStrategyRun(dealId: string) {
  const last = await prisma.negotiationStrategy.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { strategyRunId: true },
  });
  if (!last) return { strategyRunId: null as string | null, strategies: [] as Awaited<ReturnType<typeof prisma.negotiationStrategy.findMany>> };
  const strategies = sortStrategiesForDisplay(
    await prisma.negotiationStrategy.findMany({
      where: { dealId, strategyRunId: last.strategyRunId },
    }),
  );
  return { strategyRunId: last.strategyRunId, strategies };
}

export async function updateNegotiationStrategyBroker(input: {
  dealId: string;
  strategyId: string;
  workflowStatus: "BROKER_SELECTED" | "BROKER_APPROVED_TO_SEND" | "DISMISSED" | "AI_PROPOSED";
  brokerNotes?: string | null;
  suggestedPrice?: number | null;
  conditionChangesJson?: unknown;
}) {
  const row = await prisma.negotiationStrategy.findFirst({
    where: { id: input.strategyId, dealId: input.dealId },
  });
  if (!row) throw new Error("Strategy not found");

  if (input.workflowStatus === "BROKER_SELECTED" || input.workflowStatus === "BROKER_APPROVED_TO_SEND") {
    await prisma.negotiationStrategy.updateMany({
      where: { dealId: input.dealId, strategyRunId: row.strategyRunId, id: { not: input.strategyId } },
      data: { workflowStatus: "AI_PROPOSED" },
    });
  }

  return prisma.negotiationStrategy.update({
    where: { id: input.strategyId },
    data: {
      workflowStatus: input.workflowStatus,
      brokerNotes: input.brokerNotes ?? undefined,
      suggestedPrice: input.suggestedPrice ?? undefined,
      conditionChangesJson:
        input.conditionChangesJson !== undefined ? (input.conditionChangesJson as object) : undefined,
    },
  });
}
