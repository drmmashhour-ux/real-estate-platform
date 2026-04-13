/**
 * Confidence-aware refinement for public Deal Analyzer output — deterministic only.
 * Order: data-quality multiplier → freshness decay → strategy hints → conflict penalty.
 */

export type ConfidenceBand = "low" | "medium" | "high";

export type InvestmentStrategyMode =
  | "buy_to_live"
  | "buy_to_rent"
  | "buy_to_flip"
  | "buy_for_bnhub"
  | "hold_long_term"
  | string;

export type ConfidenceRefinementInput = {
  baseLevel: ConfidenceBand;
  investmentScore: number;
  riskScore: number;
  opportunityType: InvestmentStrategyMode;
  comparablesConfidence: string | null | undefined;
  comparableCount: number;
  analysisUpdatedAt: Date;
  scenarioModes: (string | null | undefined)[];
};

function rank(level: ConfidenceBand): number {
  if (level === "high") return 2;
  if (level === "medium") return 1;
  return 0;
}

function toBand(r: number): ConfidenceBand {
  if (r >= 2) return "high";
  if (r >= 1) return "medium";
  return "low";
}

const MS_PER_DAY = 86400000;

/** 1. Data confidence: weak comps or thin evidence pulls the band down. */
function dataQualityPenalty(input: ConfidenceRefinementInput): number {
  let steps = 0;
  const c = (input.comparablesConfidence ?? "").toLowerCase();
  if (c === "low" || input.comparableCount < 3) steps += 1;
  if (input.comparableCount === 0 && c !== "high") steps += 1;
  return steps;
}

/** 3. Freshness: stale analyses decay one step after 30d, another after 90d. */
function freshnessPenalty(updatedAt: Date, now: Date): number {
  const ageDays = (now.getTime() - updatedAt.getTime()) / MS_PER_DAY;
  if (ageDays >= 90) return 2;
  if (ageDays >= 30) return 1;
  return 0;
}

/** 2. Strategy-aware weight hints (warnings only — does not invent scores). */
function strategyNotes(opportunityType: string, scenarioModes: (string | null | undefined)[]): string[] {
  const o = opportunityType.toLowerCase();
  const modes = scenarioModes.map((m) => (m ?? "").toLowerCase());
  const notes: string[] = [];
  if (o.includes("rent") || modes.some((m) => m.includes("rent"))) {
    notes.push("Strategy: buy-to-rent — cash flow and occupancy weigh more in this mode.");
  }
  if (o.includes("flip")) {
    notes.push("Strategy: buy-to-flip — pricing gap and renovation risk weigh more in this mode.");
  }
  if (o.includes("bnhub")) {
    notes.push("Strategy: BNHUB — occupancy and trust signals weigh more in this mode.");
  }
  return notes;
}

/** 4. Conflict penalty: high deal score + high risk → soften confidence + warn. */
function conflictPenalty(investmentScore: number, riskScore: number): { steps: number; warn: boolean } {
  if (investmentScore >= 65 && riskScore >= 65) {
    return { steps: 1, warn: true };
  }
  return { steps: 0, warn: false };
}

export function refineDealAnalysisConfidence(
  input: ConfidenceRefinementInput,
  now: Date = new Date()
): { confidenceLevel: ConfidenceBand; extraWarnings: string[]; strategyNotes: string[] } {
  let r = rank(input.baseLevel);
  const warnings: string[] = [];

  r -= dataQualityPenalty(input);
  r -= freshnessPenalty(input.analysisUpdatedAt, now);
  const conflict = conflictPenalty(input.investmentScore, input.riskScore);
  r -= conflict.steps;
  if (conflict.warn) {
    warnings.push(
      "Signals conflict: elevated risk alongside a strong opportunity label — treat recommendation as cautious until data improves."
    );
  }

  const strat = strategyNotes(input.opportunityType, input.scenarioModes);

  r = Math.max(0, Math.min(2, r));

  return {
    confidenceLevel: toBand(r),
    extraWarnings: warnings,
    strategyNotes: strat,
  };
}
