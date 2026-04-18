import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { expandSeoPageCandidatesV2 } from "./seo/seo-page-candidate-expander";
import { generateSeoDraftForOpportunity } from "./seo/seo-page-generator.service";
import { scanSocialContentCandidatesV2 } from "./social/social-candidate.service";
import { scanGrowthCampaignCandidatesV2 } from "./campaigns/campaign.service";
import type { GrowthV2ScanSummary } from "./growth-v2.types";

export async function runGrowthV2SeoScan(): Promise<{ upserts: number }> {
  return expandSeoPageCandidatesV2();
}

export async function runGrowthV2SeoDraftGenerationBatch(limit = 25): Promise<{ drafts: number }> {
  if (!engineFlags.growthV2 || !engineFlags.seoDraftGenerationV2) return { drafts: 0 };
  const rows = await prisma.seoPageOpportunity.findMany({
    where: { status: { in: ["candidate", "draft_ready"] } },
    orderBy: { opportunityScore: "desc" },
    take: limit,
    select: { id: true },
  });
  let drafts = 0;
  for (const r of rows) {
    const d = await generateSeoDraftForOpportunity(r.id);
    if (d) drafts++;
  }
  return { drafts };
}

export async function runGrowthV2ReferralAbuseScan(): Promise<{ flagged: number }> {
  if (!engineFlags.referralEngineV2) return { flagged: 0 };
  const suspicious = await prisma.referralGrowthAttribution.findMany({
    where: { suspicionScore: { gte: 70 }, reviewStatus: "pending" },
    take: 100,
    select: { id: true },
  });
  return { flagged: suspicious.length };
}

export async function runGrowthV2FullScan(): Promise<GrowthV2ScanSummary> {
  const seo = await runGrowthV2SeoScan();
  const drafts = await runGrowthV2SeoDraftGenerationBatch(15);
  const social = await scanSocialContentCandidatesV2(30);
  const campaigns = await scanGrowthCampaignCandidatesV2();
  const referrals = await runGrowthV2ReferralAbuseScan();

  return {
    seoCandidatesUpserted: seo.upserts,
    seoDraftsGenerated: drafts.drafts,
    socialCandidates: social.created,
    campaignCandidates: campaigns.inserted,
    referralAbuseCases: referrals.flagged,
  };
}
