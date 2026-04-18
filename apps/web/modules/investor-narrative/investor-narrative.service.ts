import { buildInvestorNarrativeBlocks } from "./narrative-builder.service";
import { buildCorePositioning } from "./positioning-builder.service";
import { getStandardRiskDisclosures } from "./risk-disclosure.service";

export function buildFullInvestorNarrative() {
  return {
    generatedAt: new Date().toISOString(),
    blocks: buildInvestorNarrativeBlocks(),
    positioning: buildCorePositioning(),
    risks: getStandardRiskDisclosures(),
    kind: "narrative_draft" as const,
  };
}
