import { engineFlags } from "@/config/feature-flags";
import {
  runGrowthV2FullScan,
  runGrowthV2SeoScan,
  runGrowthV2SeoDraftGenerationBatch,
  runGrowthV2ReferralAbuseScan,
} from "./growth-v2.service";
import { scanSocialContentCandidatesV2 } from "./social/social-candidate.service";
import { scanGrowthCampaignCandidatesV2 } from "./campaigns/campaign.service";
import { prisma } from "@/lib/db";
import { generateSeoDraftForOpportunity } from "./seo/seo-page-generator.service";
import { runGrowthV3Scan } from "./growth-v3.service";

/**
 * Central router for Growth v2 — respects `FEATURE_GROWTH_V2` and sub-flags.
 * TODO v3: event bus + per-tenant budgets.
 */
export const GrowthOrchestrator = {
  /** Growth Autopilot v3 — brain, SEO v3, flywheel, experiments auto (sub-features flag-gated). */
  runV3: runGrowthV3Scan,

  async run(): Promise<Awaited<ReturnType<typeof runGrowthV2FullScan>>> {
    if (!engineFlags.growthV2) {
      return {
        seoCandidatesUpserted: 0,
        seoDraftsGenerated: 0,
        socialCandidates: 0,
        campaignCandidates: 0,
        referralAbuseCases: 0,
      };
    }
    return runGrowthV2FullScan();
  },

  async runForListing(fsboListingId: string): Promise<{ socialQueued: boolean }> {
    if (!engineFlags.growthV2) return { socialQueued: false };
    const listing = await prisma.fsboListing.findUnique({
      where: { id: fsboListingId },
      select: { id: true, images: true },
    });
    if (!listing || !Array.isArray(listing.images) || listing.images.length < 4) {
      return { socialQueued: false };
    }
    const r = await scanSocialContentCandidatesV2(5);
    return { socialQueued: r.created > 0 };
  },

  async runForUser(userId: string): Promise<{ campaigns: number }> {
    if (!engineFlags.growthV2) return { campaigns: 0 };
    void userId;
    const c = await scanGrowthCampaignCandidatesV2();
    return { campaigns: c.inserted };
  },

  runSeoScan: runGrowthV2SeoScan,

  async runCampaignScan() {
    return scanGrowthCampaignCandidatesV2();
  },

  async runReferralScan() {
    return runGrowthV2ReferralAbuseScan();
  },

  async generateDraftForSeoOpportunity(seoPageOpportunityId: string) {
    return generateSeoDraftForOpportunity(seoPageOpportunityId);
  },

  async runSeoDraftBatch(limit?: number) {
    return runGrowthV2SeoDraftGenerationBatch(limit);
  },
};
