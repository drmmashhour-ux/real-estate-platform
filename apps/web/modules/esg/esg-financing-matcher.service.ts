import { evaluateFinancingSignals, financingReasoning } from "./esg-financing-rules";
import type { RetrofitPlannerContext } from "./esg-retrofit.types";
import type { SerializedEsgAction } from "./esg-action.types";
import type { RetrofitDraftRow } from "./esg-retrofit-generator";

const TAG = "[esg-financing]";

export type MatchedFinancingOption = {
  id: string;
  type: string;
  name: string;
  applicability: "HIGH" | "MEDIUM" | "LOW";
  coverageBand: string | null;
  benefit: string;
  priority: string;
  reasoning: string;
};

function resolveApplicability(signal: ReturnType<typeof evaluateFinancingSignals>, kind: string): "HIGH" | "MEDIUM" | "LOW" {
  if (signal.financingFriction) return "LOW";
  if (kind === "GREEN_LOAN" && signal.greenLoanEligible) return "HIGH";
  if (kind === "ENERGY_PROGRAM" && signal.efficiencyPrograms) return "HIGH";
  if (kind === "INCENTIVE" && signal.renewablePrograms) return "HIGH";
  if (kind === "TAX_CREDIT" && signal.efficiencyPrograms) return "MEDIUM";
  if (kind === "GRANT" && signal.efficiencyPrograms) return "MEDIUM";
  return "MEDIUM";
}

/** Deterministic matcher — every option ties to evaluated signals (no orphans). */
export function matchFinancingOptions(
  listingId: string,
  ctx: RetrofitPlannerContext,
  actions: SerializedEsgAction[],
  planRows: RetrofitDraftRow[]
): MatchedFinancingOption[] {
  const cats = new Set(planRows.map((r) => r.category));
  const signal = evaluateFinancingSignals(ctx, actions, cats);
  const reasons = financingReasoning(signal);

  const baseReason = reasons[0] ?? "Mapped from disclosure + retrofit scope signals.";

  const options: MatchedFinancingOption[] = [];

  const push = (
    type: string,
    name: string,
    coverageBand: string | null,
    benefit: string,
    priority: string,
    reasoning: string
  ) => {
    options.push({
      id: `${listingId}-${type}`,
      type,
      name,
      applicability: resolveApplicability(signal, type),
      coverageBand,
      benefit,
      priority,
      reasoning,
    });
  };

  push(
    "GREEN_LOAN",
    "Green-labeled loans & sustainability-linked debt (general)",
    signal.greenLoanEligible ? "MODERATE coverage band (market-dependent)" : "UNKNOWN until underwriting",
    "RATE_REDUCTION",
    signal.greenLoanEligible ? "HIGH" : "LOW",
    signal.greenLoanEligible ?
      `${baseReason} Applicable where lenders recognize disclosure packages aligned with eligible use-of-proceeds.`
    : `Eligibility messaging reduced until disclosures strengthen: ${baseReason}`,
  );

  push(
    "ENERGY_PROGRAM",
    "Efficiency / retrofit programs (jurisdiction-specific)",
    "PARTIAL_CAPITAL_SUPPORT (program-dependent)",
    "CAPITAL_SUPPORT",
    signal.efficiencyPrograms ? "HIGH" : "MEDIUM",
    signal.efficiencyPrograms ?
      "Energy-efficiency measures in this plan align with common program categories — verify local rules before claiming eligibility."
    : "Limited efficiency scope in current selection; expand operational/capex energy actions to strengthen program fit.",
  );

  push(
    "INCENTIVE",
    "Renewables & clean-tech incentives",
    signal.renewablePrograms ? "MODERATE offset band (policy-dependent)" : "UNKNOWN",
    "CAPITAL_SUPPORT",
    signal.renewablePrograms ? "HIGH" : "LOW",
    signal.renewablePrograms ?
      "Renewables-related line items improve incentive mapping — incentives are equipment/path dependent."
    : "No strong renewables signal in current plan rows; revisit if solar/storage enters scope.",
  );

  push(
    "TAX_CREDIT",
    "Tax-advantaged treatments (where applicable)",
    "QUALITATIVE — advisor review required",
    "TAX_BENEFIT",
    "LOW",
    "Tax outcomes require jurisdictional advice; included only as a diligence reminder, not an estimate.",
  );

  push(
    "GRANT",
    "Capital grants for deep retrofit / affordability-linked programs",
    planRows.some((r) => r.phase >= 4) ? "LOW-TO-MODERATE (competitive)" : "LOW",
    "CAPITAL_SUPPORT",
    planRows.some((r) => r.phase >= 4) ? "MEDIUM" : "LOW",
    planRows.some((r) => r.phase >= 4) ?
      "Capex-grade phases may qualify for deeper retrofit grants where programs exist — competition and caps apply."
    : "Capex depth is limited in this plan version; grant fit may improve if Phase 4 scope expands.",
  );

  const appRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return options.sort(
    (a, b) =>
      (appRank[a.applicability] ?? 9) - (appRank[b.applicability] ?? 9) ||
      a.type.localeCompare(b.type)
  );
}

export function financingMatcherTag(): string {
  return TAG;
}
