import type { SerializedEsgAction } from "./esg-action.types";
import type {
  RetrofitPlannerContext,
  RetrofitPhaseNumber,
  RetrofitStrategyType,
} from "./esg-retrofit.types";

export type RetrofitDraftRow = {
  actionId: string | null;
  title: string;
  category: string;
  phase: RetrofitPhaseNumber;
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  paybackBand: string | null;
  dependenciesJson: Record<string, unknown> | null;
  notes: string | null;
};

function clampPhase(n: number): RetrofitPhaseNumber {
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n as RetrofitPhaseNumber;
}

/** Deterministic mapping from Action Center taxonomy → roadmap phase. */
export function inferRetrofitPhase(action: SerializedEsgAction): RetrofitPhaseNumber {
  const cat = action.category;
  const type = action.actionType;

  if (cat === "DATA" || cat === "DISCLOSURE") return 1;
  if (cat === "FINANCE" && type === "DOCUMENTATION") return 1;

  if (cat === "CERTIFICATION") {
    if (type === "STRATEGIC" || type === "CAPEX") return 5;
    return 1;
  }

  if (type === "QUICK_WIN") return 2;
  if (type === "DOCUMENTATION") return cat === "DISCLOSURE" || cat === "DATA" ? 1 : 2;

  if (type === "OPERATIONAL") return 3;
  if (type === "CAPEX") return 4;
  if (type === "STRATEGIC") return 5;

  if (cat === "ENERGY" || cat === "CARBON" || cat === "HEALTH" || cat === "RESILIENCE") {
    return 3;
  }

  return 3;
}

function baselineDataReady(ctx: RetrofitPlannerContext): boolean {
  return (ctx.dataCoveragePercent ?? 0) >= 22;
}

function strategyMaxPhase(s: RetrofitStrategyType): RetrofitPhaseNumber {
  switch (s) {
    case "BASELINE":
      return 2;
    case "OPTIMIZED":
      return 3;
    case "AGGRESSIVE":
      return 4;
    case "NET_ZERO_PATH":
      return 5;
    default:
      return 3;
  }
}

/** Map impact estimates to directional bands (no numeric score promises). */
export function retrofitImpactBandFromAction(a: SerializedEsgAction): string {
  const s = a.estimatedScoreImpact ?? 0;
  const c = a.estimatedCarbonImpact ?? 0;
  if (s >= 12 || c >= 12) return "MATERIAL (directional)";
  if (s >= 5 || c >= 5) return "MODERATE (directional)";
  return "INCREMENTAL (directional)";
}

function applyDependencyGates(row: RetrofitDraftRow, ctx: RetrofitPlannerContext): RetrofitDraftRow {
  if (row.phase >= 4 && !baselineDataReady(ctx)) {
    return {
      ...row,
      notes: [
        row.notes,
        "Sequencing: capex-grade items require baseline metering/utility disclosure (Phase 1) before execution — shown as gated.",
      ]
        .filter(Boolean)
        .join(" "),
      dependenciesJson: {
        ...(row.dependenciesJson ?? {}),
        requiresPhaseMin: 1,
        gate: "BASELINE_DATA",
        deferred: true,
      },
    };
  }
  if (row.phase === 5 && row.category === "CERTIFICATION" && !baselineDataReady(ctx)) {
    return {
      ...row,
      notes: [
        row.notes,
        "Certification pathway requires documentation readiness — complete disclosure evidence before committing to audits.",
      ]
        .filter(Boolean)
        .join(" "),
      dependenciesJson: {
        ...(row.dependenciesJson ?? {}),
        gate: "DOCUMENTATION_READY",
        deferred: true,
      },
    };
  }
  return row;
}

function filterForStrategy(rows: RetrofitDraftRow[], strategy: RetrofitStrategyType): RetrofitDraftRow[] {
  const maxP = strategyMaxPhase(strategy);

  return rows
    .filter((r) => {
      if (r.phase <= maxP) return true;
      return false;
    })
    .map((r) => {
      if (strategy === "BASELINE") {
        if (r.phase === 1) return r;
        if (r.phase === 2) {
          const cheap =
            r.costBand === "LOW" ||
            r.costBand === "UNKNOWN" ||
            (r.costBand === "MEDIUM" && /quick|meter|light|sensor|submeter/i.test(r.title));
          const disclosureLike = /disclosure|utility|bill|data|meter/i.test(r.title);
          if (r.costBand === "HIGH") return null;
          if (!cheap && !disclosureLike) return null;
          return r;
        }
        return null;
      }
      if (strategy === "OPTIMIZED" && r.phase > 3) return null;
      if (strategy === "AGGRESSIVE" && r.phase > 4) return null;
      return r;
    })
    .filter((x): x is RetrofitDraftRow => x !== null);
}

export function buildRetrofitDraftRows(
  actions: SerializedEsgAction[],
  ctx: RetrofitPlannerContext,
  strategy: RetrofitStrategyType
): RetrofitDraftRow[] {
  const open = actions.filter((a) => ["OPEN", "IN_PROGRESS", "BLOCKED"].includes(a.status));

  const rows: RetrofitDraftRow[] = open.map((a) => {
    const phase = clampPhase(inferRetrofitPhase(a));
    const base: RetrofitDraftRow = {
      actionId: a.id,
      title: a.title,
      category: a.category,
      phase,
      costBand: a.estimatedCostBand ?? null,
      impactBand: retrofitImpactBandFromAction(a),
      timelineBand: a.estimatedTimelineBand ?? null,
      paybackBand: a.paybackBand ?? null,
      dependenciesJson: null,
      notes:
        a.reasonText?.slice(0, 280) ??
        `Supports investor-grade sequencing for ${a.category.toLowerCase()} — execution subject to diligence.`,
    };
    return applyDependencyGates(base, ctx);
  });

  const filtered = filterForStrategy(rows, strategy);

  /** Deterministic tie-break: title */
  return filtered.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    return a.title.localeCompare(b.title);
  });
}

export function planSummaryForStrategy(strategy: RetrofitStrategyType): { name: string; summary: string } {
  switch (strategy) {
    case "BASELINE":
      return {
        name: "Baseline retrofit",
        summary:
          "Prioritizes quick wins, evidence closure, and low-cost upgrades. Fastest path to incremental ESG uplift on a conservative budget band.",
      };
    case "OPTIMIZED":
      return {
        name: "Optimized retrofit",
        summary:
          "Balances disclosure work, low-cost measures, and operational improvements for a strong ESG uplift without full deep retrofit scope.",
      };
    case "AGGRESSIVE":
      return {
        name: "Aggressive retrofit",
        summary:
          "Adds capex-grade building improvements for stronger carbon narrative; assumes phased funding and contractor planning.",
      };
    case "NET_ZERO_PATH":
      return {
        name: "Net-zero trajectory",
        summary:
          "Long-range sequencing toward deep retrofit and renewables integration — indicative timeline bands only; engineering packages still required.",
      };
    default:
      return { name: "Retrofit plan", summary: "Phased execution roadmap — band-based estimates." };
  }
}
