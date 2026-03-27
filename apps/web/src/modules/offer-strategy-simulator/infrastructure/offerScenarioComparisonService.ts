import type {
  OfferScenarioInput,
  ScenarioComparisonResult,
} from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { runOfferScenarioSimulation } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import type { ListingSimulationContext } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { SIMULATOR_DISCLAIMER, computeSimulationConfidence } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioPolicyService";

export type LabeledOfferScenario = { id: string; label: string; input: OfferScenarioInput };

function aggressivenessScore(input: OfferScenarioInput, listCents: number): number {
  const ratio = input.offerPriceCents / Math.max(1, listCents);
  let a = ratio * 40;
  if (!input.financingCondition) a += 15;
  if (!input.inspectionCondition) a += 12;
  if (!input.documentReviewCondition) a += 10;
  return Math.round(a);
}

export function compareOfferScenarios(
  labeled: [LabeledOfferScenario, LabeledOfferScenario, LabeledOfferScenario],
  ctx: ListingSimulationContext,
): ScenarioComparisonResult {
  const scenarios = labeled.map(({ id, label, input }) => ({
    id,
    label,
    result: runOfferScenarioSimulation(input, ctx),
  }));

  const listCents = ctx.listPriceCents;
  const byRisk = [...scenarios].sort((a, b) => {
    const d = a.result.riskImpact.score - b.result.riskImpact.score;
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  const bestRiskAdjustedScenarioId = byRisk[0]!.id;

  const byAggro = [...scenarios].sort((a, b) => {
    const sa = aggressivenessScore(labeled.find((x) => x.id === a.id)!.input, listCents);
    const sb = aggressivenessScore(labeled.find((x) => x.id === b.id)!.input, listCents);
    const d = sb - sa;
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  const moreAggressiveScenarioId = byAggro[0]!.id;
  const saferScenarioId = byRisk[0]!.id;

  const conf = computeSimulationConfidence(ctx);
  const tradeoffExplanation = [
    `Risk-adjusted pick (lowest modeled risk score): ${byRisk[0]!.label}.`,
    `More aggressive illustration (higher price pressure / fewer modeled protections): ${byAggro[0]!.label}.`,
    "Tradeoffs are illustrative — acceptance, timing, and legal effect are not predicted.",
  ].join(" ");

  return {
    scenarios: scenarios.map((s) => ({ id: s.id, label: s.label, result: s.result })),
    bestRiskAdjustedScenarioId,
    saferScenarioId,
    moreAggressiveScenarioId,
    tradeoffExplanation,
    confidence: conf,
    disclaimer: SIMULATOR_DISCLAIMER,
  };
}
