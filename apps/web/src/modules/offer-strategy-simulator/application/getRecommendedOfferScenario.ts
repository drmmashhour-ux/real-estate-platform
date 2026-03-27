import {
  loadListingSimulationContext,
  runOfferScenarioSimulation,
} from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export type RecommendedOfferScenarioResult =
  | { ok: true; input: OfferScenarioInput; result: OfferSimulationResult }
  | { ok: false; error: string };

/**
 * Deterministic “template” scenario from on-file list price — not market advice.
 * 99% of list, 5% deposit, standard conditions on.
 */
export async function getRecommendedOfferScenario(propertyId: string): Promise<RecommendedOfferScenarioResult> {
  const ctx = await loadListingSimulationContext(propertyId);
  if (!ctx) return { ok: false, error: "Listing not found or unavailable for simulation." };
  const offerPriceCents = Math.max(1, Math.round(ctx.listPriceCents * 0.99));
  const depositAmountCents = Math.max(1, Math.round(offerPriceCents * 0.05));
  const input: OfferScenarioInput = {
    propertyId,
    offerPriceCents,
    depositAmountCents,
    financingCondition: true,
    inspectionCondition: true,
    documentReviewCondition: true,
    occupancyDate: null,
    signatureDate: null,
    userStrategyMode: null,
  };
  return { ok: true, input, result: runOfferScenarioSimulation(input, ctx) };
}
