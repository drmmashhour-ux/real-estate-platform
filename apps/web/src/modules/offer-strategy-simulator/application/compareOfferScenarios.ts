import { loadListingSimulationContext } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import {
  compareOfferScenarios as compareOfferScenariosCore,
  type LabeledOfferScenario,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioComparisonService";
import type { ScenarioComparisonResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { assertOfferInputs } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioPolicyService";

export type { LabeledOfferScenario };

export type CompareOfferScenariosResult =
  | { ok: true; result: ScenarioComparisonResult }
  | { ok: false; error: string };

export async function compareOfferScenarios(
  propertyId: string,
  labeled: [LabeledOfferScenario, LabeledOfferScenario, LabeledOfferScenario],
): Promise<CompareOfferScenariosResult> {
  const ctx = await loadListingSimulationContext(propertyId);
  if (!ctx) return { ok: false, error: "Listing not found or unavailable for simulation." };
  for (const row of labeled) {
    if (row.input.propertyId !== propertyId) {
      return { ok: false, error: "Each scenario input.propertyId must match the request propertyId." };
    }
    const err = assertOfferInputs(row.input.offerPriceCents, ctx.listPriceCents);
    if (err) return { ok: false, error: err };
  }
  return { ok: true, result: compareOfferScenariosCore(labeled, ctx) };
}
