import { evaluateGreenEngine } from "@/modules/green/green.engine";
import type { GreenEngineInput } from "@/modules/green/green.types";
import { evaluateGreenVerifiedPresentation } from "@/modules/green-ai/green-certification";
import { runSubsidyPipeline, type RunSubsidyPipelineArgs } from "@/modules/green-ai/pipeline/subsidy-pipeline.engine";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import { buildPitchPack } from "./pitch-generator";
import { estimateIllustrativeValueUpliftCad } from "./value-calculator";

export const ESG_SALES_POSITIONING = "Turn ESG into a sales advantage.";

export const ESG_SALES_MONETIZATION_NOTE =
  "Premium broker ESG pitches (extended appendix, branded one-pager) — reconcile with workspace billing / broker tier flags.";

export type EsgSalesPitchInput = RunSubsidyPipelineArgs & {
  /** Listing title or short label */
  propertyLabel?: string;
  city?: string | null;
  /** Declared major units for uplift math if different from pipeline resolution */
  propertyValueMajor?: number | null;
  premiumBrokerTier?: boolean;
};

export type EsgSalesPitchOutput = {
  positioning: typeof ESG_SALES_POSITIONING;
  monetizationNote: string;
  intake: GreenEngineInput;
  sellerPitch: string;
  buyerPitch: string;
  shortSummary: string;
  roiBullets: string[];
  visualCard: {
    esgScore: number;
    esgLabel: string;
    illustrativeGrantCad: number;
    illustrativeValueUpliftCad: number | null;
    badgeEligible: boolean;
    roiHeadline: string;
  };
  disclaimers: {
    pipeline: string;
    grants: string;
    pitch: string;
  };
};

const PITCH_DISCLAIMER =
  "Generated for brokerage conversations only — not investment advice, not an appraisal, and not an official incentive approval.";

export async function runEsgSalesPitch(input: EsgSalesPitchInput): Promise<EsgSalesPitchOutput> {
  const tier = parseGreenProgramTier(input.programTier ?? (input.premiumBrokerTier ? "premium" : "none"));

  const pipeline = await runSubsidyPipeline({
    ...input,
    programTier: tier,
  });

  const engine = evaluateGreenEngine(input.intake);
  const pv =
    typeof input.propertyValueMajor === "number" && input.propertyValueMajor > 0
      ? input.propertyValueMajor
      : typeof input.propertyValue === "number" && input.propertyValue > 0
        ? input.propertyValue
        : undefined;

  const uplift = estimateIllustrativeValueUpliftCad({
    propertyValueMajor: pv ?? null,
    currentScore: engine.currentScore,
    targetScore: engine.targetScore,
  });

  const label = input.propertyLabel?.trim() || "This property";
  const cert = evaluateGreenVerifiedPresentation({
    score: pipeline.analysis.ai.score,
    label: pipeline.analysis.ai.label,
    verificationLevel: pipeline.analysis.ai.verificationLevel,
    confidence: pipeline.analysis.ai.confidence,
    programTier: tier,
    premiumReportPurchased: input.premiumReportPurchased,
  });

  const pack = buildPitchPack({
    propertyLabel: label,
    city: input.city ?? null,
    aiScore: pipeline.analysis.ai.score,
    estimatedGrantCad: pipeline.estimatedGrants.estimatedGrant,
    illustrativeValueUpliftCad: uplift.illustrativeValueUpliftCad,
    grantDisclaimer: pipeline.estimatedGrants.disclaimer,
    operatingCostNote:
      pipeline.analysis.ai.score >= 60
        ? "Modeled efficiency is above-average for many legacy homes — emphasize lower demand vs single-glazed oil-heated peers."
        : undefined,
  });

  const roiHeadline =
    uplift.illustrativeValueUpliftCad != null
      ? `Up to ~${Math.round(uplift.illustrativeValueUpliftCad).toLocaleString("en-CA")} illustrative equity story vs declared value`
      : "Add declared value to unlock illustrative uplift";

  return {
    positioning: ESG_SALES_POSITIONING,
    monetizationNote: ESG_SALES_MONETIZATION_NOTE,
    intake: input.intake,
    sellerPitch: pack.sellerPitch,
    buyerPitch: pack.buyerPitch,
    shortSummary: pack.shortSummary,
    roiBullets: pack.roiBullets,
    visualCard: {
      esgScore: pipeline.analysis.ai.score,
      esgLabel: pipeline.analysis.ai.label,
      illustrativeGrantCad: pipeline.estimatedGrants.estimatedGrant,
      illustrativeValueUpliftCad: uplift.illustrativeValueUpliftCad,
      badgeEligible: cert.showBadge,
      roiHeadline,
    },
    disclaimers: {
      pipeline: pipeline.disclaimers.pipeline,
      grants: pipeline.estimatedGrants.disclaimer,
      pitch: PITCH_DISCLAIMER,
    },
  };
}
