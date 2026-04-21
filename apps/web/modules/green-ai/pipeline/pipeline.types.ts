/**
 * End-to-end green subsidy / execution pipeline — informational only.
 */

import type { GreenImprovement } from "@/modules/green/green.types";
import type { GreenAiEngineOutput } from "@/modules/green-ai/green.types";
import type { RenoclimatEligibilityResult } from "@/modules/green-ai/renoclimat/renoclimat.types";
import type { QuebecEsgBundle } from "@/modules/green-ai/green.types";
import type { RenoclimatGrantEstimate } from "@/modules/green-ai/renoclimat/grant-calculator";
import type { EligibleGrantDisplay } from "@/modules/green-ai/grants/grants.engine";
import type { GreenUpgradePlanItem } from "@/modules/green-ai/green.types";
import type { MatchedContractor } from "@/modules/contractors/contractor.model";
import type { CertificationView } from "@/modules/green-ai/green-certification";

export const PIPELINE_POSITIONING = "From property → to funded green upgrade → to higher-value listing";

export const PIPELINE_SAFETY_NOTICE =
  "No guarantee of grant approval, contractor outcomes, or listing performance. Confirm all incentives with official program administrators and certified evaluators.";

export type SubsidyPipelineStage = "ANALYSIS" | "PLANNING" | "EXECUTION" | "COMPLETED";

export type SubsidyPipelineResult = {
  analysis: {
    ai: GreenAiEngineOutput;
    quebecEsg: QuebecEsgBundle;
    engineImprovements: GreenImprovement[];
  };
  renoclimat: RenoclimatEligibilityResult;
  quebecGrants: {
    eligibleGrants: EligibleGrantDisplay[];
    disclaimer: string;
  };
  estimatedGrants: RenoclimatGrantEstimate;
  roiContext: {
    grantToPropertyValueRatio: number | null;
    propertyValueMajor: number | null;
    note: string | null;
  };
  upgradePlan: GreenUpgradePlanItem[];
  contractors: MatchedContractor[];
  certificationPreview: CertificationView;
  listingBoost: {
    modelEligible: boolean;
    summary: string;
  };
  disclaimers: {
    pipeline: string;
    renoclimatGrants: string;
    contractor: string;
    officialPrograms: string;
  };
  monetization: {
    premiumReport: string;
    contractorLeads: string;
    listingBoost: string;
  };
  positioning: typeof PIPELINE_POSITIONING;
};
