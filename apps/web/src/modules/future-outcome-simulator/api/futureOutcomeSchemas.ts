import { z } from "zod";
import { offerScenarioInputSchema } from "@/src/modules/offer-strategy-simulator/api/offerStrategySchemas";
import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";

/** Minimal validation for nested simulator result — structure is stable from simulateOfferStrategy. */
const impactVectorSchema = z.object({
  score: z.number(),
  band: z.nativeEnum(ImpactBand),
  summary: z.string(),
});

export const offerSimulationResultSchema = z.object({
  dealImpact: impactVectorSchema,
  leverageImpact: impactVectorSchema,
  riskImpact: impactVectorSchema,
  readinessImpact: impactVectorSchema,
  recommendedStrategy: z.string(),
  keyWarnings: z.array(z.string()),
  recommendedProtections: z.array(z.string()),
  nextActions: z.array(z.string()),
  confidence: z.nativeEnum(SimulationConfidence),
  disclaimer: z.string(),
});

const futureOutcomeCaseInputSchema = z.object({
  caseStatus: z.enum(["critical", "attention", "ready"]),
  signatureReadinessStatus: z.enum(["not_ready", "almost_ready", "ready"]),
  blockerLabels: z.array(z.string()),
  warningLabels: z.array(z.string()),
  primaryNextAction: z.string(),
  documentPanels: z.object({
    sellerDeclaration: z.enum(["complete", "incomplete", "blocked"]),
    contract: z.enum(["complete", "incomplete", "blocked"]),
    review: z.enum(["complete", "incomplete", "blocked"]),
  }),
  legalFileHealth: z.string(),
  legalBlockingIssues: z.array(z.string()),
  knowledgeBlockCount: z.number().int().nonnegative(),
  knowledgeWarningCount: z.number().int().nonnegative(),
});

const dealSignalsSchema = z.object({
  trustScore: z.number().nullable(),
  completenessPercent: z.number(),
  blockerCount: z.number().int().nonnegative(),
  contradictionCount: z.number().int().nonnegative(),
});

export const futureOutcomeBodySchema = z.object({
  propertyId: z.string().min(1),
  listPriceCents: z.number().int().nonnegative(),
  scenarioInput: offerScenarioInputSchema,
  simulationResult: offerSimulationResultSchema,
  caseState: futureOutcomeCaseInputSchema.nullable().optional(),
  dealSignals: dealSignalsSchema.nullable().optional(),
});
