/**
 * Exit path evaluation — heuristic, educational only.
 * Does not value the business, predict closing probability, or replace advisors.
 */

import { ACQUISITION, IPO, type ExitRecommendation, type ExitType } from "./exit-types";
import {
  analyzeMetrics,
  type CompanyMetrics,
  type MetricAnalysis,
  type PathRisks,
  type ReadinessDimension,
} from "./metrics.service";

export type ExitEvaluationResult = {
  recommendation: ExitRecommendation;
  /** Ordered bullets explaining the suggestion from current inputs. */
  reasoning: string[];
  /** How complete the input set is — not statistical confidence in an outcome. */
  dataCompleteness: "low" | "medium" | "high";
  metricAnalysis: MetricAnalysis;
  acquisition: { overallScore: number; dimensions: ReadinessDimension[] };
  ipo: { overallScore: number; dimensions: ReadinessDimension[] };
  risks: PathRisks[];
  gaps: string[];
};

/** Illustrative revenue bands for IPO *readiness* discussion — not legal thresholds. */
const IPO_SCALE_ANCHORS = [
  { rev: 5_000_000, score: 22 },
  { rev: 25_000_000, score: 40 },
  { rev: 75_000_000, score: 58 },
  { rev: 150_000_000, score: 72 },
  { rev: 300_000_000, score: 82 },
] as const;

function scoreIpoScale(annualRevenue: number): { score: number; detail: string } {
  if (annualRevenue <= 0) {
    return { score: 0, detail: "Revenue missing — scale cannot be assessed." };
  }
  let s = 0;
  for (const a of IPO_SCALE_ANCHORS) {
    if (annualRevenue >= a.rev) s = a.score;
  }
  if (annualRevenue < IPO_SCALE_ANCHORS[0].rev) {
    s = Math.round((annualRevenue / IPO_SCALE_ANCHORS[0].rev) * IPO_SCALE_ANCHORS[0].score);
  }
  s = Math.min(95, s);
  return {
    score: s,
    detail:
      "Uses a simple revenue ladder only to discuss typical *reporting* and *governance* burdens — not listing eligibility or valuation.",
  };
}

function scoreGrowth(growth: number | null): { score: number; detail: string } {
  if (growth == null) {
    return { score: 35, detail: "Growth unknown — scored conservatively in the mid band." };
  }
  // Saturating map: negative growth scores low; strong growth scores higher but capped
  const g = growth;
  let score = 40 + Math.round(Math.min(0.6, Math.max(-0.3, g)) * 80);
  score = Math.min(92, Math.max(12, score));
  return {
    score,
    detail: `Based on entered YoY revenue growth of ${(g * 100).toFixed(1)}% (historical, not projected).`,
  };
}

function scoreProfitabilitySignal(
  m: MetricAnalysis
): { score: number; detail: string } {
  if (!m.hasProfitabilitySignal) {
    return {
      score: 38,
      detail: "No margin data — profitability signal treated as unknown for both paths.",
    };
  }
  const margin = m.ebitdaMargin ?? m.netMargin ?? 0;
  const score = Math.min(
    90,
    Math.round(45 + Math.max(-20, Math.min(35, margin * 120)))
  );
  return {
    score,
    detail:
      "Margins are user-entered snapshots; public-market narratives often stress durability of margins quarter to quarter.",
  };
}

function score1to5ToPercent(v: number | undefined, fallback: number): { pct: number; usedFallback: boolean } {
  if (v == null || v === 0) return { pct: fallback, usedFallback: true };
  return { pct: Math.round((v / 5) * 100), usedFallback: false };
}

function acquisitionDimensions(metrics: CompanyMetrics, m: MetricAnalysis): ReadinessDimension[] {
  const a = metrics.readiness?.acquisition;
  const strategicFromInput = score1to5ToPercent(a?.strategicValue, Math.round(35 + m.marketPresenceScore * 45));
  const buyerFromInput = score1to5ToPercent(a?.buyerInterest, Math.round(25 + m.marketPresenceScore * 25));
  const integrationFromInput = score1to5ToPercent(
    a?.integrationEase,
    Math.round(40 + m.marketPresenceScore * 15)
  );

  return [
    {
      id: "strategic_value",
      label: "Strategic value to buyers",
      score: strategicFromInput.pct,
      detail: strategicFromInput.usedFallback
        ? "Inferred lightly from market presence and revenue scale until you score differentiation explicitly (1–5)."
        : "Based on your self-assessed strategic value score.",
    },
    {
      id: "buyer_interest",
      label: "Buyer interest / process heat",
      score: buyerFromInput.pct,
      detail: buyerFromInput.usedFallback
        ? "No buyer-interest score provided — default assumes limited validated process depth."
        : "Based on your self-assessed buyer-interest score.",
    },
    {
      id: "integration_potential",
      label: "Integration feasibility",
      score: integrationFromInput.pct,
      detail: integrationFromInput.usedFallback
        ? "Integration ease inferred conservatively; add a 1–5 score for a data-based update."
        : "Based on your self-assessed integration ease (higher = simpler fold-in).",
    },
  ];
}

function ipoDimensions(metrics: CompanyMetrics, m: MetricAnalysis): ReadinessDimension[] {
  const scale = scoreIpoScale(m.annualRevenue);
  const growth = scoreGrowth(m.revenueGrowthYoy);
  const margins = scoreProfitabilitySignal(m);
  const ip = metrics.readiness?.ipo;

  const gov = score1to5ToPercent(ip?.governanceMaturity, 32);
  const fin = score1to5ToPercent(ip?.financialReportingMaturity, 30);
  const consistency = score1to5ToPercent(ip?.resultsConsistency, Math.round((growth.score + margins.score) / 2));

  return [
    {
      id: "scale",
      label: "Scale vs public-company operating load",
      score: scale.score,
      detail: scale.detail,
    },
    {
      id: "consistency",
      label: "Results consistency (growth + margins + your consistency score)",
      score: Math.round((growth.score * 0.35 + margins.score * 0.35 + consistency.pct * 0.3)),
      detail: consistency.usedFallback
        ? "Emphasizes entered growth/margins because consistency was not self-scored."
        : "Blends your consistency score with entered growth and margin signals.",
    },
    {
      id: "governance",
      label: "Governance & reporting maturity",
      score: Math.round((gov.pct * 0.55 + fin.pct * 0.45)),
      detail:
        (gov.usedFallback && fin.usedFallback
          ? "Governance and reporting scores not provided — IPO readiness here is intentionally discounted."
          : "Based on your governance and financial reporting maturity scores.") +
        " IPO paths usually require durable controls and cadence beyond a one-off data pull.",
    },
  ];
}

function average(dim: ReadinessDimension[]): number {
  if (!dim.length) return 0;
  return Math.round(dim.reduce((s, d) => s + d.score, 0) / dim.length);
}

function buildRisks(): PathRisks[] {
  return [
    {
      path: ACQUISITION,
      risks: [
        {
          title: "Buyer concentration & timing",
          detail:
            "A narrow buyer list or stalled process can extend timelines; diligence findings may change price and structure.",
        },
        {
          title: "Integration & retention",
          detail:
            "Post-close integration, earn-outs, and retention of key people are common friction points — not modeled here.",
        },
        {
          title: "Regulatory / clearance",
          detail:
            "Antitrust or sector-specific approvals may apply depending on jurisdiction and buyer — requires specialist review.",
        },
      ],
    },
    {
      path: IPO,
      risks: [
        {
          title: "Market window & volatility",
          detail:
            "Public listings expose the company to market sentiment; windows can shift quickly — this tool does not forecast markets.",
        },
        {
          title: "Ongoing disclosure cadence",
          detail:
            "Quarterly reporting, controls attestation, and investor relations workload are ongoing — not a one-time project.",
        },
        {
          title: "Governance expectations",
          detail:
            "Board structure, independence, and policy depth expectations often rise materially vs private-company norms.",
        },
      ],
    },
  ];
}

function dataCompleteness(metrics: CompanyMetrics, m: MetricAnalysis): "low" | "medium" | "high" {
  let points = 0;
  if (m.annualRevenue > 0) points += 2;
  if (m.revenueGrowthYoy != null) points += 1;
  if (m.hasProfitabilitySignal) points += 1;
  if (m.marketPresenceScore > 0) points += 1;
  const a = metrics.readiness?.acquisition;
  const i = metrics.readiness?.ipo;
  if (a && a.strategicValue && a.buyerInterest && a.integrationEase) points += 1;
  if (i && i.governanceMaturity && i.financialReportingMaturity && i.resultsConsistency) points += 1;
  if (points >= 6) return "high";
  if (points >= 3) return "medium";
  return "low";
}

function pickRecommendation(
  acq: number,
  ipo: number,
  completeness: "low" | "medium" | "high",
  m: MetricAnalysis
): { rec: ExitRecommendation; reasoning: string[] } {
  const reasoning: string[] = [];

  if (m.annualRevenue <= 0) {
    reasoning.push("Add a good-faith LTM revenue figure to compare paths on a common baseline.");
    return { rec: "NEED_MORE_DATA", reasoning };
  }

  if (completeness === "low") {
    reasoning.push(
      "Several inputs are missing (growth, margins, readiness scores, or market presence). The suggestion below is directional until you complete more fields."
    );
  }

  const diff = acq - ipo;
  const tie = 12;

  if (Math.abs(diff) <= tie) {
    reasoning.push(
      `Acquisition readiness (${acq}) and IPO readiness (${ipo}) are close on the current rubric — many teams run parallel education tracks before choosing a lead path.`
    );
    reasoning.push("Use the gap list to prioritize the next facts or controls to strengthen before committing to a process design.");
    return { rec: "EITHER", reasoning };
  }

  if (diff > tie) {
    reasoning.push(
      `Acquisition readiness (${acq}) is ahead of IPO readiness (${ipo}) on entered data — often consistent with earlier-stage scale or buyer-specific strategic fit.`
    );
    reasoning.push("This is not a valuation conclusion; validate buyer universe, synergies, and legal structure with qualified advisors.");
    return { rec: ACQUISITION, reasoning };
  }

  reasoning.push(
    `IPO readiness (${ipo}) is ahead of acquisition readiness (${acq}) on entered data — often consistent with scale, reporting cadence, and governance investments.`
  );
  reasoning.push("Listing readiness still depends on exchange rules, auditor work, and market conditions not captured here.");
  return { rec: IPO, reasoning };
}

/**
 * Evaluate acquisition vs IPO readiness from user-supplied metrics.
 */
export function evaluateExit(metrics: CompanyMetrics): ExitEvaluationResult {
  const metricAnalysis = analyzeMetrics(metrics);
  const acqDims = acquisitionDimensions(metrics, metricAnalysis);
  const ipoDims = ipoDimensions(metrics, metricAnalysis);
  const acqScore = average(acqDims);
  const ipoScore = average(ipoDims);
  const completeness = dataCompleteness(metrics, metricAnalysis);

  const { rec, reasoning } = pickRecommendation(acqScore, ipoScore, completeness, metricAnalysis);

  const gaps: string[] = [];
  for (const d of [...acqDims, ...ipoDims]) {
    if (d.score < 45) {
      gaps.push(`${d.label}: strengthen inputs or operating proof points (${d.detail})`);
    }
  }
  if (metricAnalysis.revenueGrowthYoy == null) {
    gaps.push("Provide YoY revenue growth to reduce uncertainty in trajectory-sensitive comparisons.");
  }
  if (!metricAnalysis.hasProfitabilitySignal) {
    gaps.push("Add at least one profitability metric (EBITDA or net margin) if available — many buyers and public investors ask for margin durability.");
  }
  if (metricAnalysis.marketPresenceScore <= 0.1) {
    gaps.push("Market presence score is near zero — add a normalized 0–1 score or narrative so strategic positioning is data-backed.");
  }
  const a = metrics.readiness?.acquisition;
  const i = metrics.readiness?.ipo;
  if (!a?.strategicValue || !a?.buyerInterest || !a?.integrationEase) {
    gaps.push("Complete acquisition readiness scores (1–5) for strategic value, buyer interest, and integration ease.");
  }
  if (!i?.governanceMaturity || !i?.financialReportingMaturity || !i?.resultsConsistency) {
    gaps.push("Complete IPO readiness scores (1–5) for governance, financial reporting, and results consistency.");
  }

  return {
    recommendation: rec,
    reasoning,
    dataCompleteness: completeness,
    metricAnalysis,
    acquisition: { overallScore: acqScore, dimensions: acqDims },
    ipo: { overallScore: ipoScore, dimensions: ipoDims },
    risks: buildRisks(),
    gaps: Array.from(new Set(gaps)),
  };
}
