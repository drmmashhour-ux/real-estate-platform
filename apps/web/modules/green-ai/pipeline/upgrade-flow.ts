import type { SubsidyPipelineStage } from "./pipeline.types";

export const OFFICIAL_PROGRAM_NOTICE =
  "Always confirm eligibility, amounts, and deadlines with official program administrators before relying on any estimate.";

export const GREEN_UPGRADE_JOURNEY_STEPS = [
  { id: "eligibility", label: "Eligibility" },
  { id: "grants", label: "Grants" },
  { id: "roi", label: "ROI" },
  { id: "contractors", label: "Contractors" },
  { id: "completion", label: "Completion" },
] as const;

export type GreenUpgradeJourneyStepId = (typeof GREEN_UPGRADE_JOURNEY_STEPS)[number]["id"];

const STAGE_ORDER: SubsidyPipelineStage[] = ["ANALYSIS", "PLANNING", "EXECUTION", "COMPLETED"];

export function isSubsidyPipelineStage(raw: string): raw is SubsidyPipelineStage {
  return STAGE_ORDER.includes(raw as SubsidyPipelineStage);
}

export function nextSubsidyPipelineStage(stage: SubsidyPipelineStage): SubsidyPipelineStage | null {
  const i = STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1]!;
}

/** Maps persisted stage to the journey step index (0–4) for the dashboard stepper. */
export function journeyActiveStepIndex(stage: SubsidyPipelineStage): number {
  switch (stage) {
    case "ANALYSIS":
      return 1;
    case "PLANNING":
      return 2;
    case "EXECUTION":
      return 3;
    case "COMPLETED":
      return 4;
    default:
      return 0;
  }
}

/** Monetization copy — billing is wired elsewhere; UI labels only. */
export const PIPELINE_MONETIZATION = {
  premiumReport: "Premium verification report unlocks staged upgrade intelligence and badge-readiness diagnostics.",
  contractorLeads: "Matched contractor introductions and quote requests monetize qualified renovation intent.",
  listingBoost: "Premium green program tier includes illustrative browse ranking priority — not a performance guarantee.",
} as const;
