/**
 * Ranks markets and composes advisory recommendation text — no side effects, no auto-launch.
 */
import type { PrismaClient } from "@prisma/client";
import type { ExpansionRecommendation, RankedMarket } from "./market.types";
import { buildMarketsFromDatabase } from "./market-data.builder";
import {
  normalizeExpansionWeights,
  riskLevelFromMarket,
  scoreMarket,
  type ExpansionScoringWeights,
} from "./scoring.engine";

function parseWeightsOverride(): ExpansionScoringWeights | undefined {
  const raw = process.env.EXPANSION_AI_WEIGHTS_JSON?.trim();
  if (!raw) return undefined;
  try {
    const j = JSON.parse(raw) as Partial<ExpansionScoringWeights>;
    return normalizeExpansionWeights(j);
  } catch {
    return undefined;
  }
}

function composeReasoning(ranked: RankedMarket[], weights: ExpansionScoringWeights): string[] {
  const lines: string[] = [];
  lines.push(
    `Weights: demand ${(weights.demand * 100).toFixed(0)}%, competition (inverse saturation) ${(weights.competition * 100).toFixed(0)}%, regulation (inverse friction) ${(weights.regulation * 100).toFixed(0)}%, revenue proxy ${(weights.revenuePotential * 100).toFixed(0)}%. Missing factors are excluded and remaining weights renormalize — scores are not padded with guesses.`
  );

  const top = ranked.slice(0, 5);
  if (top.length === 0) {
    lines.push("No candidate cities returned from the database for the selected statuses.");
    return lines;
  }

  lines.push("Top markets by internal opportunity score (higher = stronger telemetry-backed signal):");
  for (const r of top) {
    const covPct = Math.round(r.score.dataCoverage * 100);
    const sc = r.score.score;
    lines.push(
      `  ${r.rank}. ${r.market.city}, ${r.market.country} — score ${sc == null ? "n/a" : sc}, data weight coverage ~${covPct}% (of nominal factor weights present).`
    );
  }

  const best = ranked[0];
  if (best?.score.score != null) {
    const strong = best.score.breakdown.filter((b) => b.input != null && b.input >= 0.65);
    const weak = best.score.breakdown.filter((b) => b.input != null && b.input <= 0.35);
    if (strong.length) {
      lines.push(
        `Strongest pillars for ${best.market.city}: ${strong.map((b) => b.label.split("(")[0].trim()).join("; ")}.`
      );
    }
    if (weak.length) {
      lines.push(
        `Watch items for ${best.market.city}: ${weak.map((b) => b.label.split("(")[0].trim()).join("; ")} — validate before committing launch timing.`
      );
    }
  }

  lines.push(
    "Launch timing is a business decision: use regulation/readiness and competitive saturation lines above together with GTM capacity — this tool does not schedule or enable cities automatically."
  );

  return lines;
}

export async function buildExpansionRecommendations(
  db: PrismaClient
): Promise<ExpansionRecommendation> {
  const weights = parseWeightsOverride() ?? normalizeExpansionWeights();
  const markets = await buildMarketsFromDatabase(db);

  const ranked: RankedMarket[] = markets
    .map((market) => ({
      market,
      score: scoreMarket(market, weights),
      rank: 0,
    }))
    .sort((a, b) => {
      const sa = a.score.score;
      const sb = b.score.score;
      if (sa == null && sb == null) return a.market.city.localeCompare(b.market.city);
      if (sa == null) return 1;
      if (sb == null) return -1;
      if (sb !== sa) return sb - sa;
      return a.market.city.localeCompare(b.market.city);
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const bestRanked =
    ranked.find((r) => r.score.score != null && r.score.dataCoverage >= 0.15) ?? null;
  const bestCity = bestRanked?.market ?? null;
  const riskLevel = bestRanked ? riskLevelFromMarket(bestRanked.market, bestRanked.score) : "high";

  return {
    bestCity,
    reasoning: composeReasoning(ranked, weights),
    riskLevel,
    ranked,
    weights,
    advisoryOnly: true,
    generatedAt: new Date().toISOString(),
  };
}
