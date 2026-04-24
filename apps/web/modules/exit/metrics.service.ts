/**
 * Company metrics snapshot for exit planning — user-supplied or imported facts.
 * No implied audit, no forward-looking guarantee.
 */

import type { ExitType } from "./exit-types";

/** 0 = unknown / not assessed; 1–5 = qualitative maturity or strength. */
export type Score1to5 = 0 | 1 | 2 | 3 | 4 | 5;

export type ProfitabilitySnapshot = {
  /** EBITDA margin as decimal, e.g. 0.12 for 12%. Omit if unknown. */
  ebitdaMargin?: number | null;
  /** Net margin as decimal. Omit if unknown. */
  netMargin?: number | null;
};

export type MarketPresenceSnapshot = {
  /**
   * Normalized 0–1 where 0 = early/local, 1 = category-leading / multi-region.
   * Caller defines methodology; engine uses it comparatively only.
   */
  normalizedScore: number;
  /** Optional context (e.g. "2 countries", "niche leader"). */
  summary?: string;
};

/**
 * Optional readiness inputs so the model stays adaptable beyond raw financials.
 * All scores are self-assessed unless you wire external data.
 */
export type ReadinessInputs = {
  acquisition?: {
    /** Differentiation, strategic fit to likely buyers. */
    strategicValue: Score1to5;
    /** LOIs, active dialogues, inbound interest. */
    buyerInterest: Score1to5;
    /**
     * How cleanly the business could fold into a buyer (5 = simple / modular).
     * Higher = lower integration risk for heuristic scoring.
     */
    integrationEase: Score1to5;
  };
  ipo?: {
    /** Board independence, committee structure, policy maturity. */
    governanceMaturity: Score1to5;
    /** Audited or audit-ready financials, close cycles, controls. */
    financialReportingMaturity: Score1to5;
    /** Revenue / margin stability vs volatile spikes. */
    resultsConsistency: Score1to5;
  };
};

export type CompanyMetrics = {
  /** Reporting currency code (ISO 4217), e.g. USD. */
  currency: string;
  /** Last twelve months revenue in major units (same as currency). */
  annualRevenue: number;
  /** YoY revenue growth as decimal, e.g. 0.35 for 35%. Null if unknown. */
  revenueGrowthYoy: number | null;
  profitability?: ProfitabilitySnapshot | null;
  marketPresence: MarketPresenceSnapshot;
  readiness?: ReadinessInputs | null;
  /** Free-form facts that flow through to dashboards only. */
  notes?: string;
};

export type MetricAnalysis = {
  currency: string;
  annualRevenue: number;
  revenueGrowthYoy: number | null;
  hasProfitabilitySignal: boolean;
  ebitdaMargin: number | null;
  netMargin: number | null;
  marketPresenceScore: number;
  marketPresenceSummary?: string;
  /** Plain, non-predictive interpretation strings. */
  highlights: string[];
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clampMargin(m: number | null | undefined): number | null {
  if (m == null || !Number.isFinite(m)) return null;
  return Math.min(0.6, Math.max(-0.5, m));
}

/**
 * Validate and summarize metrics for display and downstream scoring.
 */
export function analyzeMetrics(metrics: CompanyMetrics): MetricAnalysis {
  const currency = metrics.currency?.trim().toUpperCase().slice(0, 3) || "USD";
  const annualRevenue = Math.max(0, Number(metrics.annualRevenue) || 0);
  const revenueGrowthYoy =
    metrics.revenueGrowthYoy == null || !Number.isFinite(metrics.revenueGrowthYoy)
      ? null
      : metrics.revenueGrowthYoy;

  const ebitdaMargin = clampMargin(metrics.profitability?.ebitdaMargin ?? null);
  const netMargin = clampMargin(metrics.profitability?.netMargin ?? null);
  const hasProfitabilitySignal = ebitdaMargin != null || netMargin != null;

  const marketPresenceScore = clamp01(metrics.marketPresence?.normalizedScore ?? 0);
  const marketPresenceSummary = metrics.marketPresence?.summary?.trim() || undefined;

  const highlights: string[] = [];

  if (annualRevenue <= 0) {
    highlights.push("Revenue not provided or zero — exit framing needs a baseline revenue figure.");
  } else {
    highlights.push(
      `Reported LTM revenue: ${annualRevenue.toLocaleString()} ${currency} (user-supplied, not verified).`
    );
  }

  if (revenueGrowthYoy == null) {
    highlights.push("Growth rate not supplied — comparisons that depend on trajectory are limited.");
  } else {
    highlights.push(
      `Reported YoY revenue growth: ${(revenueGrowthYoy * 100).toFixed(1)}% (historical, not a forecast).`
    );
  }

  if (!hasProfitabilitySignal) {
    highlights.push("No profitability inputs — path comparison leans on revenue, presence, and readiness scores.");
  } else {
    if (ebitdaMargin != null) {
      highlights.push(`EBITDA margin (as entered): ${(ebitdaMargin * 100).toFixed(1)}%.`);
    }
    if (netMargin != null) {
      highlights.push(`Net margin (as entered): ${(netMargin * 100).toFixed(1)}%.`);
    }
  }

  highlights.push(
    `Market presence score (normalized 0–1): ${marketPresenceScore.toFixed(2)}${
      marketPresenceSummary ? ` — ${marketPresenceSummary}` : ""
    }.`
  );

  return {
    currency,
    annualRevenue,
    revenueGrowthYoy,
    hasProfitabilitySignal,
    ebitdaMargin,
    netMargin,
    marketPresenceScore,
    marketPresenceSummary,
    highlights,
  };
}

export type ReadinessDimension = {
  id: string;
  label: string;
  /** 0–100 for UI bars. */
  score: number;
  detail: string;
};

export type PathRisks = {
  path: ExitType;
  risks: { title: string; detail: string }[];
};
