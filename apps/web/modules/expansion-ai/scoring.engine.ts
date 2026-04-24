/**
 * Pure scoring — no I/O. Weights configurable; missing factors renormalize (no fabricated values).
 */
import type {
  ExpansionScoringWeights,
  Market,
  MarketFactorBreakdown,
  MarketRiskLevel,
  MarketScoreResult,
} from "./market.types";

export const DEFAULT_EXPANSION_WEIGHTS: ExpansionScoringWeights = {
  demand: 0.3,
  competition: 0.2,
  regulation: 0.2,
  revenuePotential: 0.3,
};

/** Clamp and normalize user/env overrides so weights sum to 1. */
export function normalizeExpansionWeights(partial?: Partial<ExpansionScoringWeights>): ExpansionScoringWeights {
  const base = { ...DEFAULT_EXPANSION_WEIGHTS, ...partial };
  const sum = base.demand + base.competition + base.regulation + base.revenuePotential;
  if (!Number.isFinite(sum) || sum <= 0) return { ...DEFAULT_EXPANSION_WEIGHTS };
  return {
    demand: base.demand / sum,
    competition: base.competition / sum,
    regulation: base.regulation / sum,
    revenuePotential: base.revenuePotential / sum,
  };
}

function parseWeightsFromEnv(): ExpansionScoringWeights {
  const raw = process.env.EXPANSION_AI_WEIGHTS_JSON?.trim();
  if (!raw) return { ...DEFAULT_EXPANSION_WEIGHTS };
  try {
    const j = JSON.parse(raw) as Partial<ExpansionScoringWeights>;
    return normalizeExpansionWeights(j);
  } catch {
    return { ...DEFAULT_EXPANSION_WEIGHTS };
  }
}

/**
 * Demand signal: blend booking + listing/lead activity proxies (already 0–1 in Market).
 */
function demandInput(m: Market): number | null {
  const b = m.tourismDemand;
  const a = m.realEstateActivity;
  if (b == null && a == null) return null;
  if (b != null && a != null) return Math.max(0, Math.min(1, (b + a) / 2));
  return b ?? a ?? null;
}

/**
 * Competition: Market stores **saturation** (higher = worse). Convert to opportunity (1 - saturation).
 */
function competitionOpportunityInput(m: Market): number | null {
  if (m.competitionLevel == null) return null;
  return Math.max(0, Math.min(1, 1 - m.competitionLevel));
}

/**
 * Regulation: Market stores **friction** (higher = worse). Opportunity = 1 - friction.
 */
function regulationOpportunityInput(m: Market): number | null {
  if (m.regulatoryComplexity == null) return null;
  return Math.max(0, Math.min(1, 1 - m.regulatoryComplexity));
}

function revenueInput(m: Market): number | null {
  if (m.revenuePotential == null) return null;
  return Math.max(0, Math.min(1, m.revenuePotential));
}

export function scoreMarket(market: Market, weights?: ExpansionScoringWeights): MarketScoreResult {
  const w = normalizeExpansionWeights(weights ?? parseWeightsFromEnv());

  const dIn = demandInput(market);
  const cIn = competitionOpportunityInput(market);
  const rIn = regulationOpportunityInput(market);
  const revIn = revenueInput(market);

  const factors: Array<{
    key: keyof ExpansionScoringWeights;
    label: string;
    input: number | null;
    note: string;
  }> = [
    {
      key: "demand",
      label: "Demand (booking + activity proxies)",
      input: dIn,
      note: "From internal 90d BNHub bookings and lead/listing mix — not external demand forecasts.",
    },
    {
      key: "competition",
      label: "Competition (inverse saturation)",
      input: cIn,
      note: "Lower host/listing saturation yields higher opportunity score.",
    },
    {
      key: "regulation",
      label: "Regulation / launch readiness (inverse friction)",
      input: rIn,
      note: "From launch stage and platform readiness flags — not legal advice.",
    },
    {
      key: "revenuePotential",
      label: "Revenue potential (recent booking GMV proxy)",
      input: revIn,
      note: "Normalized confirmed booking totals (90d) — not audited revenue.",
    },
  ];

  let denom = 0;
  let numer = 0;
  const breakdown: MarketFactorBreakdown[] = [];

  for (const f of factors) {
    const wNom = w[f.key];
    if (f.input == null) {
      breakdown.push({
        label: f.label,
        weightNominal: wNom,
        weightEffective: 0,
        input: null,
        contribution: 0,
        note: `${f.note} — no input (excluded from score).`,
      });
      continue;
    }
    denom += wNom;
    numer += wNom * f.input;
    breakdown.push({
      label: f.label,
      weightNominal: wNom,
      weightEffective: wNom,
      input: f.input,
      contribution: wNom * f.input,
      note: f.note,
    });
  }

  const dataCoverage = denom;
  const score =
    denom > 1e-9 ? Math.round(Math.max(0, Math.min(100, (numer / denom) * 100))) : null;

  if (denom > 1e-9) {
    for (const b of breakdown) {
      if (b.input != null) b.weightEffective = b.weightNominal / denom;
    }
  }

  const weightsApplied = w;

  return { score, breakdown, dataCoverage, weightsApplied };
}

export function riskLevelFromMarket(m: Market, scoreResult: MarketScoreResult): MarketRiskLevel {
  const reg = m.regulatoryComplexity ?? 0;
  const cov = scoreResult.dataCoverage;
  if (cov < 0.35) return "high";
  if (reg >= 0.75) return "high";
  if (reg >= 0.55 || (m.competitionLevel ?? 0) >= 0.75) return "medium";
  if ((scoreResult.score ?? 0) >= 70 && cov >= 0.85) return "low";
  return "medium";
}
