import { assertOfferInputs } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioPolicyService";
import {
  loadListingSimulationContext,
  runOfferScenarioSimulation,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export type SimulateOfferStrategyResult =
  | { ok: true; result: OfferSimulationResult }
  | { ok: false; error: string };

export async function simulateOfferStrategy(input: OfferScenarioInput): Promise<SimulateOfferStrategyResult> {
  const ctx = await loadListingSimulationContext(input.propertyId);
  if (!ctx) return { ok: false, error: "Listing not found or unavailable for simulation." };
  const err = assertOfferInputs(input.offerPriceCents, ctx.listPriceCents);
  if (err) return { ok: false, error: err };
  return { ok: true, result: runOfferScenarioSimulation(input, ctx) };
}
