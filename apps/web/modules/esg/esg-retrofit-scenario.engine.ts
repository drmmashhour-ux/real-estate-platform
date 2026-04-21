import type { RetrofitScenarioOutput } from "./esg-retrofit.types";
import type { RetrofitDraftRow } from "./esg-retrofit-generator";
import { evaluateFinancingSignals, financingReasoning } from "./esg-financing-rules";
import type { RetrofitPlannerContext } from "./esg-retrofit.types";
import type { SerializedEsgAction } from "./esg-action.types";

const TAG = "[esg-retrofit-scenario]";

const COST_ORDER: Record<string, number> = {
  LOW: 0,
  UNKNOWN: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const TIMELINE_ORDER: Array<{ re: RegExp; rank: number; label: string }> = [
  { re: /30D|2-4W|WEEK/i, rank: 0, label: "SHORT" },
  { re: /1-3M|1-2M|2-3M|90D/i, rank: 1, label: "MEDIUM" },
  { re: /3-12M|3-6M|6-9M|6-12M/i, rank: 2, label: "LONG" },
  { re: /12M|1-2Y|2Y|3Y|5Y|7Y|Y\+/i, rank: 3, label: "EXTENDED" },
];

function maxCostBand(bands: (string | null | undefined)[]): string | null {
  const clean = bands.filter((b): b is string => Boolean(b));
  if (clean.length === 0) return "UNKNOWN";
  return clean.reduce((a, b) => (COST_ORDER[a] ?? 1) >= (COST_ORDER[b] ?? 1) ? a : b);
}

function maxTimelineLabel(bands: (string | null | undefined)[]): string | null {
  const clean = bands.filter((b): b is string => Boolean(b));
  if (clean.length === 0) return "MEDIUM (typical)";
  let best = 0;
  for (const t of clean) {
    for (const { re, rank } of TIMELINE_ORDER) {
      if (re.test(t) && rank >= best) best = rank;
    }
  }
  const label = TIMELINE_ORDER.find((x) => x.rank === best)?.label ?? "MEDIUM";
  return `${label} (planning band — not a schedule guarantee)`;
}

function impactBandMerge(rows: RetrofitDraftRow[]): string {
  const hasMaterial = rows.some((r) => (r.impactBand ?? "").includes("MATERIAL"));
  const hasMod = rows.some((r) => (r.impactBand ?? "").includes("MODERATE"));
  if (hasMaterial) return "MATERIAL (directional range)";
  if (hasMod) return "MODERATE (directional range)";
  return "INCREMENTAL (directional range)";
}

function scoreBandHint(ctx: RetrofitPlannerContext, rows: RetrofitDraftRow[]): string {
  const uplift =
    rows.reduce((s, r) => {
      const m = /directional/i.test(r.impactBand ?? "") ? 1 : 0;
      return s + m;
    }, 0) > 2 ?
      "Composite grade could trend upward"
    : "Composite could improve incrementally";
  const grade = ctx.grade ? ` vs current grade ${ctx.grade}` : "";
  return `${uplift}${grade} — advisory band only, not a forecast.`;
}

function carbonBandHint(rows: RetrofitDraftRow[]): string {
  const carbonHeavy = rows.some((r) => r.category === "CARBON" || /carbon|heat pump|envelope|solar/i.test(r.title));
  return carbonHeavy ?
      "Carbon narrative could strengthen materially if metering validates savings — expressed as a qualitative band."
    : "Operational carbon uplift likely incremental until capex-grade measures are in scope.";
}

const PAYBACK_RANK: Record<string, number> = {
  UNKNOWN: 0,
  "<3Y": 1,
  "3-7Y": 2,
  "7Y+": 3,
};

/** Conservative directional payback posture from Action Center payback bands — not IRR or yield. */
function directionalRoiBandFromRows(rows: RetrofitDraftRow[]): string | null {
  const bands = rows.map((r) => r.paybackBand).filter((b): b is string => Boolean(b));
  if (bands.length === 0) return "UNKNOWN / LONG (directional — metering-dependent)";
  const longest = bands.reduce((a, b) => ((PAYBACK_RANK[b] ?? 0) >= (PAYBACK_RANK[a] ?? 0) ? b : a));
  return `${longest} blended payback posture (directional; not an investment return forecast)`;
}

export function buildRetrofitScenario(
  rows: RetrofitDraftRow[],
  ctx: RetrofitPlannerContext,
  allActions: SerializedEsgAction[],
  scenarioName?: string
): RetrofitScenarioOutput & { financingFitNotes: string[] } {
  const cats = new Set(rows.map((r) => r.category));
  const signal = evaluateFinancingSignals(ctx, allActions, cats);
  const reasoning = financingReasoning(signal);

  const assumptions = [
    "Bands aggregate Action Center estimates — not quotes, bids, or audits.",
    "Dependencies (e.g., disclosure before capex) must be respected in execution sequencing.",
    scenarioName ? `Scenario label: ${scenarioName}` : "Custom scenario selection.",
  ];

  const risks = [
    "Retrofit outcomes depend on occupancy, tariffs, incentive rule changes, and contractor scope.",
    ...(!signal.financingFriction ? [] : ["Thin evidence base — financing posture remains conservative until uploads improve."]),
  ];

  const financingFit =
    signal.financingFriction ? "LIMITED / DATA_GATED"
    : signal.greenLoanEligible ? "STRONG_NARRATIVE_POTENTIAL"
    : signal.efficiencyPrograms ? "PROGRAM_ALIGNED"
    : "GENERIC";

  return {
    totalCostBand: maxCostBand(rows.map((r) => r.costBand)),
    totalImpactBand: impactBandMerge(rows),
    timelineBand: maxTimelineLabel(rows.map((r) => r.timelineBand)),
    expectedScoreBand: scoreBandHint(ctx, rows),
    expectedCarbonReductionBand: carbonBandHint(rows),
    directionalRoiBand: directionalRoiBandFromRows(rows),
    financingFit,
    risks,
    assumptions,
    financingFitNotes: reasoning,
  };
}

export function scenarioEngineTag(): string {
  return TAG;
}
