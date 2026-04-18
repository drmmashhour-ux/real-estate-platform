import { engineFlags } from "@/config/feature-flags";
import { scanSeoPageOpportunitiesFromFsboInventory } from "./seo/seo-candidate.service";
import { scanReengagementAlertCandidates } from "./alerts/alert-candidate.service";
import { scanFeaturedAndCampaignCandidates } from "./campaigns/campaign-candidate.service";
import type { GrowthScanSummary } from "./growth.types";

/** Single entry for growth scans — respects engine feature flags. */
export async function runGrowthOpportunityScan(): Promise<GrowthScanSummary> {
  if (!engineFlags.growthAutopilotV1) {
    return { seoUpserts: 0, opportunityRows: 0, alertCandidates: 0, campaignCandidates: 0 };
  }

  const [seo, alerts, campaigns] = await Promise.all([
    scanSeoPageOpportunitiesFromFsboInventory(),
    scanReengagementAlertCandidates(),
    scanFeaturedAndCampaignCandidates(),
  ]);

  return {
    seoUpserts: seo.upserts,
    opportunityRows: campaigns.rows + alerts.rows,
    alertCandidates: alerts.rows,
    campaignCandidates: campaigns.rows,
  };
}
