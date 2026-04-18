import type { MarketingCampaign } from "@prisma/client";

/**
 * Budget reminders — financial truth stays in accounting; this surfaces notes only.
 */
export function describeCampaignBudgetNotes(campaign: MarketingCampaign) {
  return {
    name: campaign.name,
    notes: campaign.notes ?? null,
    reminder: "Record paid spend in your finance system; tie UTMs to those entries for ROI.",
  };
}
