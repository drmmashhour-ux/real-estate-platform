import { prisma } from "@/lib/db";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { toSavedScenarioDto } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioSavedMapper";

export type SaveOfferScenarioArgs = {
  userId: string;
  propertyId: string;
  caseId: string | null;
  scenarioLabel: string;
  input: OfferScenarioInput;
  output: OfferSimulationResult;
  notes?: string | null;
};

export async function saveOfferScenario(args: SaveOfferScenarioArgs) {
  const row = await prisma.offerStrategyScenario.create({
    data: {
      propertyId: args.propertyId,
      caseId: args.caseId,
      userId: args.userId,
      scenarioLabel: args.scenarioLabel.trim().slice(0, 200),
      inputPayload: args.input as object,
      outputPayload: args.output as object,
      notes: args.notes?.trim() ? args.notes.trim().slice(0, 2000) : null,
    },
  });
  return toSavedScenarioDto(row);
}
