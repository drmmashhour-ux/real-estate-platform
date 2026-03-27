import { prisma } from "@/lib/db";
import type { SavedScenariosComparisonView } from "@/src/modules/offer-strategy-simulator/domain/savedScenario.types";
import { toSavedScenarioDto } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioSavedMapper";

function deterministicSummary(aLabel: string, bLabel: string, aOut: { dealImpact: { score: number }; riskImpact: { score: number } }, bOut: typeof aOut): string {
  const dealDelta = aOut.dealImpact.score - bOut.dealImpact.score;
  const riskDelta = aOut.riskImpact.score - bOut.riskImpact.score;
  return [
    `Stored snapshot comparison only (no new simulation run).`,
    `"${aLabel}" vs "${bLabel}": deal impact scores ${aOut.dealImpact.score} vs ${bOut.dealImpact.score} (Δ ${dealDelta}).`,
    `Risk impact scores ${aOut.riskImpact.score} vs ${bOut.riskImpact.score} (Δ ${riskDelta}).`,
    `Does not predict acceptance, legal effect, or future market conditions.`,
  ].join(" ");
}

export async function compareSavedOfferScenarios(args: {
  userId: string;
  propertyId: string;
  idA: string;
  idB: string;
}): Promise<{ ok: true; comparison: SavedScenariosComparisonView } | { ok: false; error: string }> {
  const [rowA, rowB] = await Promise.all([
    prisma.offerStrategyScenario.findFirst({
      where: { id: args.idA, userId: args.userId, propertyId: args.propertyId },
    }),
    prisma.offerStrategyScenario.findFirst({
      where: { id: args.idB, userId: args.userId, propertyId: args.propertyId },
    }),
  ]);
  if (!rowA || !rowB) return { ok: false, error: "One or both scenarios were not found." };
  if (rowA.id === rowB.id) return { ok: false, error: "Pick two different scenarios." };

  const a = toSavedScenarioDto(rowA);
  const b = toSavedScenarioDto(rowB);
  const summary = deterministicSummary(a.scenarioLabel, b.scenarioLabel, a.output, b.output);

  return {
    ok: true,
    comparison: { a, b, summary },
  };
}
