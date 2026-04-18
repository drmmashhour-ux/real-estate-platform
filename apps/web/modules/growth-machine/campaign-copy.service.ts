/**
 * Campaign-oriented copy bundles — delegates to growth-content (deterministic).
 */
import type { GrowthContentInput } from "./growth-content.service";
import { generateGrowthContentDrafts } from "./growth-content.service";

export function buildCampaignCopyBundle(input: GrowthContentInput) {
  const drafts = generateGrowthContentDrafts(input);
  return {
    campaignNameHint: `${input.city}-${input.audience}-${input.campaignGoal}`,
    drafts,
    ctaSuggestions: [drafts.poster.cta, drafts.googleAdsStyle.headlines[0]].filter(Boolean),
  };
}
