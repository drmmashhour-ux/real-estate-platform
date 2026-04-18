/**
 * Read-only aggregation from existing growth modules — no writes, no source edits.
 */

import { prisma } from "@/lib/db";
import { getAdsPerformanceByCampaign, getAdsPerformanceSummary } from "@/modules/ads/ads-performance.service";
import { buildAutopilotActions } from "@/modules/growth/ai-autopilot.service";
import { aiAutopilotContentAssistFlags, bnhubGuestConversionFlags } from "@/config/feature-flags";
import { BnhubBookingFunnelStage } from "@prisma/client";
import { buildContentHub } from "@/modules/growth/ai-autopilot-content-hub.service";
import { buildInfluenceSuggestions, type InfluenceSnapshot } from "@/modules/growth/ai-autopilot-influence.service";
import { runCroV8OptimizationBundle } from "@/services/growth/cro-v8-optimization-bridge";
import type { CroV8OptimizationBundle } from "@/services/growth/cro-v8-optimization.types";
import type { AiAutopilotAction } from "@/modules/growth/ai-autopilot.types";
import type { AiInfluenceSuggestion } from "@/modules/growth/ai-autopilot-influence.types";
import type { AdsPerformanceSummary } from "@/modules/ads/ads-performance.service";
import type { CampaignAdsMetrics } from "@/modules/ads/ads-performance.service";

const RANGE_DAYS = 90;

export type GrowthFusionRawSnapshot = {
  createdAt: string;
  leads: {
    totalCount: number;
    recent7dCount: number;
  };
  ads: {
    summary: AdsPerformanceSummary | null;
    byCampaign: CampaignAdsMetrics[] | null;
  };
  cro: CroV8OptimizationBundle | null;
  content: {
    adDrafts: number;
    listingDrafts: number;
    outreachDrafts: number;
    skippedReason?: string;
  };
  autopilot: {
    actions: AiAutopilotAction[];
  };
  influence: {
    suggestions: AiInfluenceSuggestion[];
  };
  /** Read-only BNHub guest funnel hint when guest conversion flag is on (no per-listing mutation). */
  bnhubGuestConversion?: {
    enabled: true;
    bookingFunnelStarts30d: number;
    note: string;
  };
  warnings: string[];
};

function toInfluenceSnapshot(
  summary: AdsPerformanceSummary | null,
  campaignRows: CampaignAdsMetrics[] | null,
): InfluenceSnapshot {
  const leads = summary?.leads ?? 0;
  const impressions = summary?.impressions ?? 0;
  const clicks = summary?.clicks ?? 0;
  const conv = summary?.conversionRatePercent ?? null;
  return {
    conversionRateViewToLeadPercent: conv,
    funnelSteps: {
      landing_view: Math.max(0, impressions),
      cta_click: Math.max(0, clicks),
      listing_view: 0,
      lead_capture: Math.max(0, leads),
    },
    leadsFromPublicLanding: leads,
    campaignsCount: campaignRows?.length ?? 0,
    clicks90d: clicks,
    impressions90d: impressions,
  };
}

export async function buildGrowthFusionSnapshot(): Promise<GrowthFusionRawSnapshot> {
  const createdAt = new Date().toISOString();
  const warnings: string[] = [];

  let leadsTotal = 0;
  let recent7d = 0;
  try {
    const weekAgo = new Date(Date.now() - 7 * 864e5);
    const [t, r] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
    leadsTotal = t;
    recent7d = r;
  } catch {
    warnings.push("leads_count_unavailable");
  }

  let adsSummary: AdsPerformanceSummary | null = null;
  let byCampaign: CampaignAdsMetrics[] | null = null;
  try {
    adsSummary = await getAdsPerformanceSummary(RANGE_DAYS, { estimatedSpend: 0 });
    byCampaign = await getAdsPerformanceByCampaign(RANGE_DAYS, {});
  } catch {
    warnings.push("ads_performance_unavailable");
  }

  let cro: CroV8OptimizationBundle | null = null;
  try {
    cro = await runCroV8OptimizationBundle({ rangeDays: 14, offsetDays: 0 });
  } catch {
    warnings.push("cro_bundle_unavailable");
  }

  let content = { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: undefined as string | undefined };
  try {
    if (
      aiAutopilotContentAssistFlags.contentAssistV1 &&
      (aiAutopilotContentAssistFlags.adCopyV1 ||
        aiAutopilotContentAssistFlags.listingCopyV1 ||
        aiAutopilotContentAssistFlags.outreachCopyV1)
    ) {
      const hub = buildContentHub({ leadSegment: "seller" }, { now: createdAt });
      content = {
        adDrafts: hub.adCopy.length,
        listingDrafts: hub.listingCopy.length,
        outreachDrafts: hub.outreachCopy.length,
      };
    } else {
      content = { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: "content_assist_flags_off" };
    }
  } catch {
    content = { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: "content_hub_error" };
    warnings.push("content_hub_unavailable");
  }

  let autopilotActions: AiAutopilotAction[] = [];
  try {
    autopilotActions = buildAutopilotActions();
  } catch {
    warnings.push("autopilot_actions_unavailable");
  }

  let influenceSuggestions: AiInfluenceSuggestion[] = [];
  try {
    influenceSuggestions = buildInfluenceSuggestions(toInfluenceSnapshot(adsSummary, byCampaign), { now: createdAt });
  } catch {
    warnings.push("influence_suggestions_unavailable");
  }

  let bnhubGuestConversion: GrowthFusionRawSnapshot["bnhubGuestConversion"];
  if (bnhubGuestConversionFlags.guestConversionV1) {
    try {
      const d30 = new Date(Date.now() - 30 * 86400000);
      const bookingFunnelStarts30d = await prisma.bnhubClientBookingFunnelEvent.count({
        where: { stage: BnhubBookingFunnelStage.STARTED, createdAt: { gte: d30 } },
      });
      bnhubGuestConversion = {
        enabled: true,
        bookingFunnelStarts30d,
        note:
          "BNHub guest conversion layer is enabled — per-listing advisory metrics on the host dashboard; no automatic listing or booking changes.",
      };
    } catch {
      warnings.push("bnhub_guest_conversion_rollup_unavailable");
    }
  }

  return {
    createdAt,
    leads: { totalCount: leadsTotal, recent7dCount: recent7d },
    ads: { summary: adsSummary, byCampaign },
    cro,
    content,
    autopilot: { actions: autopilotActions },
    influence: { suggestions: influenceSuggestions },
    bnhubGuestConversion,
    warnings,
  };
}
