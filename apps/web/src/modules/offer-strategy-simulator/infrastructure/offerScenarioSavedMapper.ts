import type { OfferStrategyScenario } from "@prisma/client";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import type { SavedOfferScenarioDto } from "@/src/modules/offer-strategy-simulator/domain/savedScenario.types";

export function toSavedScenarioDto(row: OfferStrategyScenario): SavedOfferScenarioDto {
  return {
    id: row.id,
    propertyId: row.propertyId,
    caseId: row.caseId,
    userId: row.userId,
    scenarioLabel: row.scenarioLabel,
    input: row.inputPayload as OfferScenarioInput,
    output: row.outputPayload as OfferSimulationResult,
    selected: row.selected,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
