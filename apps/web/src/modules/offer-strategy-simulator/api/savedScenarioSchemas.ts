import { z } from "zod";
import { offerScenarioInputSchema } from "@/src/modules/offer-strategy-simulator/api/offerStrategySchemas";

export const saveOfferScenarioBodySchema = z.object({
  propertyId: z.string().min(1),
  caseId: z.string().min(1).nullable(),
  scenarioLabel: z.string().min(1).max(200),
  input: offerScenarioInputSchema,
  /** Stored simulation result snapshot (deterministic JSON; shape validated at write time in app). */
  output: z.any(),
});

export const selectOfferScenarioBodySchema = z.object({
  propertyId: z.string().min(1),
  caseId: z.string().min(1).nullable(),
});

export const compareSavedScenariosBodySchema = z.object({
  propertyId: z.string().min(1),
  idA: z.string().min(1),
  idB: z.string().min(1),
});
