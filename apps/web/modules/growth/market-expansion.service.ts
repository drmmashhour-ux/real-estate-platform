/**
 * Market expansion recommendations from city comparison + real supply/demand proxies.
 */

import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildCityComparison } from "@/modules/growth/fast-deal-city-comparison.service";
import { selectTopPerformingCity } from "@/modules/growth/city-playbook-selector.service";
import { buildSignalsForCity } from "@/modules/growth/market-expansion-signals.service";
import { computeCitySimilarity } from "@/modules/growth/market-expansion-similarity.service";
import { scoreExpansionCandidate } from "@/modules/growth/market-expansion-scoring.service";
import { generateMarketExpansionInsights } from "@/modules/growth/market-expansion-insights.service";
import { monitorMarketExpansionBuilt } from "@/modules/growth/market-expansion-monitoring.service";
import type {
  MarketExpansionCandidate,
  MarketExpansionRecommendation,
  MarketExpansionRejected,
} from "@/modules/growth/market-expansion.types";

export async function buildMarketExpansionRecommendations(
  cities: string[],
  windowDays: number,
): Promise<MarketExpansionRecommendation | null> {
  if (!engineFlags.marketExpansionV1 || !engineFlags.fastDealCityComparisonV1 || cities.length === 0) {
    return null;
  }

  const comparison = await buildCityComparison(cities, windowDays);
  if (!comparison?.rankedCities.length) return null;

  const since = new Date(Date.now() - windowDays * 86400000);
  const [events, outcomes] = await Promise.all([
    prisma.fastDealSourceEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { sourceType: true, sourceSubType: true, metadataJson: true },
    }),
    prisma.fastDealOutcome.findMany({
      where: { createdAt: { gte: since } },
      select: { outcomeType: true, metadataJson: true },
    }),
  ]);

  const signalsList = await Promise.all(
    cities.map((city) => buildSignalsForCity(city, windowDays, events, outcomes)),
  );

  const picked = selectTopPerformingCity(comparison);
  const anchorRow = picked.top ?? comparison.rankedCities[0];
  const referenceCity = anchorRow?.city ?? null;
  const topSig = signalsList.find((s) => referenceCity && s.city === referenceCity) ?? signalsList[0];

  const demands = signalsList.map((s) => s.demandSignal ?? 0);
  const comps = signalsList.map((s) => s.competitionSignal ?? 0);
  const maxDemand = Math.max(1, ...demands);
  const maxComp = Math.max(1, ...comps);
  const topDs = topSig?.demandSupplyRatio;

  const ranked: MarketExpansionCandidate[] = [];
  const rejected: MarketExpansionRejected[] = [];

  for (const sig of signalsList) {
    if (referenceCity && sig.city === referenceCity) continue;

    const sim = computeCitySimilarity(topSig!, sig);

    const scored = scoreExpansionCandidate({
      signals: sig,
      similarityScore: sim.similarityScore,
      maxDemandAmongCities: maxDemand,
      maxCompetitionAmongCities: maxComp,
      topDemandSupply: topDs,
    });

    const rationaleParts = [
      `${sim.explanation}`,
      `Composite score integrates similarity (HIGH), demand proxy (HIGH), demand/supply gap vs reference (MEDIUM when available), inverted competition density (MEDIUM).`,
      `Demand proxy=${sig.demandSignal ?? "n/a"}, FSBO ACTIVE supply=${sig.supplyListingCount ?? "n/a"}, competition proxy=${sig.competitionSignal ?? "n/a"}.`,
    ];

    ranked.push({
      city: sig.city,
      score: scored.score,
      demandSignal: sig.demandSignal,
      supplySignal: sig.supplyListingCount,
      competitionSignal: sig.competitionSignal,
      similarityToTopCity: sim.similarityScore,
      readiness: scored.readiness,
      confidence: scored.confidence,
      rationale: rationaleParts.join(" "),
      warnings: scored.warnings,
    });

    if ((scored.score < 32 && scored.confidence === "low") || sig.metrics.meta.sampleSize < 8) {
      rejected.push({
        city: sig.city,
        reason:
          sig.metrics.meta.sampleSize < 8
            ? "Insufficient Fast Deal sample for expansion scoring."
            : "Low composite score with low confidence tier.",
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  const insights = generateMarketExpansionInsights({
    referenceCity,
    topCandidates: ranked.slice(0, 6),
  });

  const lowConf = ranked.filter((r) => r.confidence === "low").length;
  monitorMarketExpansionBuilt({
    windowDays,
    candidateCount: ranked.length,
    lowConfidence: lowConf,
    referenceSet: !!referenceCity,
  });

  return {
    referenceCity,
    topCandidates: ranked.slice(0, 8),
    rejectedCandidates: rejected.slice(0, 12),
    insights,
    generatedAt: new Date().toISOString(),
    windowDays,
  };
}
