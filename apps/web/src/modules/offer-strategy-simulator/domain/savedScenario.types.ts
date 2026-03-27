import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export type SavedOfferScenarioDto = {
  id: string;
  propertyId: string;
  caseId: string | null;
  userId: string;
  scenarioLabel: string;
  input: OfferScenarioInput;
  output: OfferSimulationResult;
  selected: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedScenariosComparisonView = {
  a: SavedOfferScenarioDto;
  b: SavedOfferScenarioDto;
  /** Deterministic copy-only summary from stored payloads (not a new simulation). */
  summary: string;
};
