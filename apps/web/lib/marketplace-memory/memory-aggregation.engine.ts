import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { recencyWeight, getMemoryHalfLifeDays, getMemoryLookbackDays } from "@/lib/marketplace-memory/decay";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";
import { refreshUserMemoryInsights } from "@/lib/marketplace-memory/memory-insight.engine";

export type MemoryEventLite = {
  eventType: string;
  metadataJson: unknown;
  createdAt: Date;
};

function metaObj(m: unknown): Record<string, unknown> {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return {};
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Deterministic aggregation — explainable JSON summaries (no black-box model).
 */
export function computeSummariesFromEvents(
  events: MemoryEventLite[],
  halfLifeDays: number,
  now: Date,
): {
  intentSummary: Record<string, unknown>;
  preferenceSummary: Record<string, unknown>;
  behaviorSummary: Record<string, unknown>;
  financialProfile: Record<string, unknown> | null;
  esgProfile: Record<string, unknown> | null;
  riskProfile: Record<string, unknown> | null;
} {
  const locWeights = new Map<string, number>();
  const typeWeights = new Map<string, number>();
  let wPriceMin = 0;
  let wPriceMax = 0;
  let wSumPm = 0;
  let wSumPx = 0;
  const weightedByType: Record<string, number> = {};
  let recent7d = 0;
  let esgMentions = 0;
  let esgWeight = 0;
  let riskMentions = 0;

  const cutoff7 = new Date(now.getTime() - 7 * 86_400_000);

  for (const e of events) {
    const w = recencyWeight(e.createdAt, now, halfLifeDays);
    const m = metaObj(e.metadataJson);

    weightedByType[e.eventType] = (weightedByType[e.eventType] ?? 0) + w;

    const city = typeof m.city === "string" ? m.city.trim() : "";
    const region = typeof m.region === "string" ? m.region.trim() : "";
    const loc = [city, region].filter(Boolean).join(", ");
    if (loc) locWeights.set(loc, (locWeights.get(loc) ?? 0) + w);

    const pType = typeof m.propertyType === "string" ? m.propertyType.trim() : "";
    if (pType) typeWeights.set(pType, (typeWeights.get(pType) ?? 0) + w);

    const pm = num(m.priceMin ?? m.price_min);
    const px = num(m.priceMax ?? m.price_max);
    if (pm != null) {
      wPriceMin += pm * w;
      wSumPm += w;
    }
    if (px != null) {
      wPriceMax += px * w;
      wSumPx += w;
    }

    if (e.createdAt >= cutoff7) recent7d += w;

    if (m.esgInterest === true || m.esg === true) {
      esgMentions += 1;
      esgWeight += w;
    }
    if (m.riskTolerance === "high" || m.dealRisk === "value_add") {
      riskMentions += 1;
    }
  }

  const topLocations = [...locWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, score]) => ({ location, score: Math.round(score * 100) / 100 }));

  const topPropertyTypes = [...typeWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([propertyType, score]) => ({ propertyType, score: Math.round(score * 100) / 100 }));

  const budgetMin = wSumPm > 0 ? Math.round(wPriceMin / wSumPm) : null;
  const budgetMax = wSumPx > 0 ? Math.round(wPriceMax / wSumPx) : null;

  const totalW = Object.values(weightedByType).reduce((a, b) => a + b, 0) || 1;
  const buyShare = (weightedByType.VIEW ?? 0) + (weightedByType.SAVE ?? 0) + (weightedByType.OFFER ?? 0);
  const bookShare = (weightedByType.BOOK ?? 0) + (weightedByType.VIEW ?? 0) * 0.2;
  const investShare = (weightedByType.INVEST ?? 0) + (weightedByType.VIEW ?? 0) * 0.1;

  const urgencyScore = Math.min(100, Math.round((recent7d / (totalW * 0.15 + 0.01)) * 40));

  const intentSummary = {
    weightedEventMix: weightedByType,
    buySignals: Math.round((buyShare / totalW) * 100),
    bookSignals: Math.round((bookShare / totalW) * 100),
    investSignals: Math.round((investShare / totalW) * 100),
    urgencyScore,
    computedAt: now.toISOString(),
  };

  const preferenceSummary = {
    topLocations,
    topPropertyTypes,
    budgetRange:
      budgetMin != null || budgetMax != null
        ? { min: budgetMin, max: budgetMax, note: "Inferred from weighted event metadata — editable by user." }
        : null,
  };

  const behaviorSummary = {
    activeVsPassive: urgencyScore >= 35 ? "active" : "passive",
    recentIntensity7d: Math.round(recent7d * 100) / 100,
    totalWeightedEvents: Math.round(totalW * 100) / 100,
  };

  const financialProfile =
    budgetMin != null || budgetMax != null
      ? { inferredBudgetMin: budgetMin, inferredBudgetMax: budgetMax }
      : null;

  const esgProfile =
    esgMentions > 0
      ? { interestLevel: Math.min(1, esgWeight / (esgMentions + 1)), mentions: esgMentions }
      : null;

  const riskProfile =
    riskMentions > 0 ? { valueAddOrHighRiskMentions: riskMentions } : null;

  return {
    intentSummary,
    preferenceSummary,
    behaviorSummary,
    financialProfile,
    esgProfile,
    riskProfile,
  };
}

export async function aggregateUserMemory(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return { ok: false, reason: "feature_disabled" };
  }

  await prisma.userMemoryProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  const profile = await prisma.userMemoryProfile.findUniqueOrThrow({ where: { userId } });
  if (!profile.personalizationEnabled) {
    return { ok: false, reason: "personalization_disabled" };
  }

  const lookback = getMemoryLookbackDays();
  const since = new Date(Date.now() - lookback * 86_400_000);
  const events = await prisma.userMemoryEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const halfLife = getMemoryHalfLifeDays();
  const now = new Date();
  const computed = computeSummariesFromEvents(events, halfLife, now);

  await prisma.userMemoryProfile.update({
    where: { userId },
    data: {
      intentSummaryJson: computed.intentSummary,
      preferenceSummaryJson: computed.preferenceSummary,
      behaviorSummaryJson: computed.behaviorSummary,
      financialProfileJson: computed.financialProfile,
      esgProfileJson: computed.esgProfile,
      riskProfileJson: computed.riskProfile,
      lastUpdatedAt: now,
    },
  });

  await refreshUserMemoryInsights(userId);

  void logMemoryAudit({
    userId,
    actionType: "memory_aggregated",
    summary: "Marketplace memory summaries recomputed",
    details: { eventCount: events.length, lookbackDays: lookback },
  }).catch(() => null);

  void prisma.evolutionOutcomeEvent
    .create({
      data: {
        domain: "memory",
        metricType: "memory_aggregation",
        entityType: "user",
        entityId: userId,
        expectedJson: { eventCount: events.length },
        actualJson: { urgencyScore: computed.intentSummary.urgencyScore },
        notes: "Marketplace memory aggregation completed",
      },
    })
    .catch(() => null);

  return { ok: true };
}
