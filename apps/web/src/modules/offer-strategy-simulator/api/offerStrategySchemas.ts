import { z } from "zod";

export const offerScenarioFieldsSchema = z.object({
  offerPriceCents: z.number().int().positive(),
  depositAmountCents: z.number().int().nonnegative().nullable(),
  financingCondition: z.boolean(),
  inspectionCondition: z.boolean(),
  documentReviewCondition: z.boolean(),
  occupancyDate: z.string().nullable(),
  signatureDate: z.string().nullable(),
  userStrategyMode: z.string().nullable(),
});

export const offerScenarioInputSchema = offerScenarioFieldsSchema.extend({
  propertyId: z.string().min(1),
});

export const simulateOfferStrategyBodySchema = offerScenarioInputSchema;

const labeledScenarioSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  input: offerScenarioInputSchema,
});

export const compareOfferStrategyBodySchema = z.object({
  propertyId: z.string().min(1),
  scenarios: z.tuple([labeledScenarioSchema, labeledScenarioSchema, labeledScenarioSchema]),
});
