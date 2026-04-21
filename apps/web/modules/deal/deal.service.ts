import { prisma } from "@/lib/db";
import { metricsLog } from "@/lib/metrics-log";

import { suggestNextBestAction } from "./deal.engine";
import {
  calculateCloseProbability,
  calculateDealScore,
  calculateRiskLevel,
  mapStatusToIntelligenceStage,
  type ScoreInputs,
} from "./deal-score.calculator";
import type { DealIntelligenceEventType, DealIntelligenceSnapshot } from "./deal.types";
import { logDealConversion, logDealFunnel, logDealIntel } from "./deal-intelligence.log";

const MS_DAY = 86_400_000;

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / MS_DAY);
}

/** Ask price in CAD when listing id matches CRM, FSBO, or BNHub stay (best-effort). */
export async function resolveListingAskCad(listingId: string | null): Promise<number | null> {
  if (!listingId) return null;
  try {
    const crm = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { price: true },
    });
    if (crm?.price != null && Number.isFinite(Number(crm.price))) {
      return Number(crm.price);
    }
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { priceCents: true },
    });
    if (fsbo) return fsbo.priceCents / 100;
    const stay = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { nightPriceCents: true },
    });
    if (stay != null) {
      return (stay.nightPriceCents / 100) * 30;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function gapPct(dealPriceCad: number, listPriceCad: number | null): number | null {
  if (listPriceCad == null || listPriceCad <= 0) return null;
  return (Math.abs(dealPriceCad - listPriceCad) / listPriceCad) * 100;
}

export type BuildScoreContext = {
  inputs: ScoreInputs;
  visitEver: boolean;
  documentsCount: number;
};

export async function buildScoreContext(dealId: string): Promise<BuildScoreContext | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      milestones: true,
      documents: { select: { id: true } },
      negotiationThreads: { select: { currentRound: true } },
      negotiationSuggestions: { where: { status: "rejected" }, select: { id: true } },
    },
  });

  if (!deal) return null;

  const now = new Date();
  const since14 = new Date(now.getTime() - 14 * MS_DAY);

  const [events14, visitRow, listPriceCad] = await Promise.all([
    prisma.dealIntelligenceEvent.findMany({
      where: { dealId, createdAt: { gte: since14 } },
      select: { type: true, createdAt: true },
    }),
    prisma.dealIntelligenceEvent.findFirst({
      where: { dealId, type: "VISIT" },
      select: { id: true },
    }),
    resolveListingAskCad(deal.listingId),
  ]);
  const visitEver = Boolean(visitRow);

  const dealPriceCad = deal.priceCents / 100;

  const dates = events14.map((e) => e.createdAt.toISOString().slice(0, 10));
  const activeDays14d = new Set(dates).size;
  const events14d = events14.length;
  const visitOrMessageEvents14d = events14.filter((e) => e.type === "VISIT" || e.type === "MESSAGE").length;

  const milestoneCompleted = deal.milestones.filter((m) => m.status === "completed").length;
  const milestoneTotal = deal.milestones.length;

  const negotiationRoundMax = threadRoundMax._max.currentRound ?? 0;
  const rejectedProposals = deal.negotiationSuggestions.length;

  const lastEventTime =
    events14.length > 0
      ? events14.reduce((max, e) => (e.createdAt > max ? e.createdAt : max), events14[0]!.createdAt)
      : null;
  const lastMilestoneTouch = deal.milestones.reduce<Date | null>((acc, m) => {
    const t = m.completedAt ?? m.createdAt;
    if (!acc || t > acc) return t;
    return acc;
  }, null);

  const activityCandidates = [deal.updatedAt, lastEventTime, lastMilestoneTouch].filter(
    (x): x is Date => x != null,
  );
  const lastActivityAt = activityCandidates.reduce((max, d) => (d > max ? d : max), deal.updatedAt);

  const inputs: ScoreInputs = {
    status: deal.status,
    dealPriceCad,
    listPriceCad,
    lastActivityAt,
    now,
    activeDays14d,
    events14d,
    visitOrMessageEvents14d,
    milestoneCompleted,
    milestoneTotal,
    negotiationRoundMax,
    rejectedProposals,
  };

  return {
    inputs,
    visitEver,
    documentsCount: deal.documents.length,
  };
}

export async function computeDealIntelligenceSnapshot(dealId: string): Promise<DealIntelligenceSnapshot | null> {
  const ctx = await buildScoreContext(dealId);
  if (!ctx) return null;

  const { inputs, visitEver, documentsCount } = ctx;

  const intelligenceStage = mapStatusToIntelligenceStage(inputs.status);
  const dealScore = calculateDealScore(inputs);
  const closeProbability = calculateCloseProbability(dealScore, intelligenceStage, inputs.status);
  const daysSinceLastActivity = daysBetween(inputs.lastActivityAt, inputs.now);
  const listPriceGapPct = gapPct(inputs.dealPriceCad, inputs.listPriceCad);

  const riskLevel = calculateRiskLevel({
    daysSinceLastActivity,
    listPriceGapPct,
    rejectedProposals: inputs.rejectedProposals,
    status: inputs.status,
  });

  const documentsSent = inputs.milestoneCompleted > 0 || documentsCount > 0;

  const suggestedAction = suggestNextBestAction({
    status: inputs.status,
    intelligenceStage,
    daysSinceLastActivity,
    hasVisitEvent: visitEver,
    listPriceGapPct,
    negotiationRoundMax: inputs.negotiationRoundMax,
    rejectedProposals: inputs.rejectedProposals,
    documentsSent,
    scoreInputs: inputs,
  });

  const snapshot: DealIntelligenceSnapshot = {
    dealId,
    dealScore,
    closeProbability,
    riskLevel,
    intelligenceStage,
    suggestedAction,
    computedAt: new Date(),
    inputsSummary: {
      daysSinceLastActivity,
      eventCount14d: inputs.events14d,
      negotiationRoundMax: inputs.negotiationRoundMax,
      rejectedProposals: inputs.rejectedProposals,
      listPriceGapPct,
    },
  };

  try {
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        dealScore,
        closeProbability,
        riskLevel,
        intelligenceStage,
        lastIntelligenceComputedAt: snapshot.computedAt,
      },
    });
    logDealConversion("intelligence_persisted", {
      dealId,
      dealScore,
      riskLevel,
      stage: intelligenceStage,
    });
    metricsLog.deal("intelligence_computed", {
      dealId,
      dealScore,
      intelligenceStage,
      riskLevel,
    });
  } catch (e) {
    logDealIntel("persist_failed", { dealId, err: e instanceof Error ? e.message : "unknown" });
  }

  return snapshot;
}

export async function recordDealIntelligenceEvent(
  dealId: string,
  type: DealIntelligenceEventType,
  metadata?: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  try {
    await prisma.dealIntelligenceEvent.create({
      data: {
        dealId,
        type,
        metadata: metadata ?? undefined,
      },
    });
    logDealFunnel("deal_intel_event", { dealId, type });
    await computeDealIntelligenceSnapshot(dealId);
    return { ok: true };
  } catch (e) {
    logDealIntel("event_record_failed", { dealId, err: e instanceof Error ? e.message : "unknown" });
    return { ok: false };
  }
}

/** Cron / batch: refresh scores for active deals. */
export async function recomputeDealIntelligenceBatch(limit = 40): Promise<{ processed: number }> {
  const deals = await prisma.deal.findMany({
    where: { status: { notIn: ["closed", "cancelled"] } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true },
  });

  let n = 0;
  for (const d of deals) {
    await computeDealIntelligenceSnapshot(d.id);
    n += 1;
  }
  logDealIntel("batch_recompute", { processed: n });
  return { processed: n };
}
