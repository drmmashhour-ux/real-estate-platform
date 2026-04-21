import type { SerializedEsgAction } from "./esg-action.types";
import type { RetrofitPlannerContext } from "./esg-retrofit.types";

export type FinancingRuleSignal = {
  /** Strong disclosure + score supports green loan pricing narratives (not a rate promise). */
  greenLoanEligible: boolean;
  /** Efficiency / retrofit workstreams present. */
  efficiencyPrograms: boolean;
  /** Solar or renewable storyline. */
  renewablePrograms: boolean;
  /** Certification pathway improves lender narrative. */
  certificationBoost: boolean;
  /** Missing evidence suppresses eligibility messaging. */
  financingFriction: boolean;
};

const TAG = "[esg-financing]";

export function evaluateFinancingSignals(
  ctx: RetrofitPlannerContext,
  actions: SerializedEsgAction[],
  categoriesInPlan: Set<string>
): FinancingRuleSignal {
  const score = ctx.compositeScore ?? 0;
  const coverage = ctx.dataCoveragePercent ?? 0;
  const conf = ctx.evidenceConfidence ?? 0;

  const strongDisclosure =
    coverage >= 35 && conf >= 35 && ["PASS_LIKELY", "CONDITIONAL"].includes(ctx.acquisitionReadinessBand);

  const greenLoanEligible = score >= 48 && strongDisclosure && conf >= 30;

  const efficiencyPrograms =
    categoriesInPlan.has("ENERGY") ||
    categoriesInPlan.has("CARBON") ||
    actions.some((a) => a.category === "ENERGY" || a.category === "CARBON");

  const renewablePrograms =
    ctx.solarDeclared ||
    categoriesInPlan.has("CARBON") ||
    actions.some((a) => /solar|renewable|pv/i.test(a.title));

  const certificationBoost =
    categoriesInPlan.has("CERTIFICATION") || Boolean(ctx.renovationDeclared && efficiencyPrograms);

  const financingFriction = coverage < 20 || conf < 25;

  return {
    greenLoanEligible: greenLoanEligible && !financingFriction,
    efficiencyPrograms,
    renewablePrograms,
    certificationBoost,
    financingFriction,
  };
}

/** Explainable reasoning strings — conservative, non-numeric promises. */
export function financingReasoning(signal: FinancingRuleSignal): string[] {
  const lines: string[] = [];
  if (signal.financingFriction) {
    lines.push(
      "Evidence coverage/confidence is thin — financing narratives stay conservative until metering and disclosures strengthen.",
    );
  }
  if (signal.greenLoanEligible) {
    lines.push(
      "Disclosure position + score band may support green-labeled financing discussions with lenders (terms subject to underwriting).",
    );
  }
  if (signal.efficiencyPrograms) {
    lines.push(
      "Energy-efficiency measures often align with grants and retrofit programs that publish eligibility bands rather than guarantees.",
    );
  }
  if (signal.renewablePrograms) {
    lines.push(
      "Renewables-related upgrades may map to incentive stacks where local programs define eligible equipment categories.",
    );
  }
  if (signal.certificationBoost) {
    lines.push(
      "Certification pathways can improve lender/investor packaging even before operational carbon outcomes fully appear in metered data.",
    );
  }
  if (lines.length === 0) {
    lines.push(
      "Financing mapping stays generic until retrofit scope and disclosure baseline are clearer — avoid implying lender commitments.",
    );
  }
  return lines;
}

export function financingLogTag(): string {
  return TAG;
}
