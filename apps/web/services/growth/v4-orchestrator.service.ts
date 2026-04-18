import { logInfo } from "@/lib/logger";
import type { CampaignBudgetInput, GeoPerformanceRowInput, UserSegmentSignals } from "./v4-types";
import { computeGeoPerformance, rankGeoPerformance } from "./geo-performance.service";
import { splitBudgetByGeo } from "./geo-budget-split.service";
import { recommendBudget } from "./predictive-budget.service";
import { detectUserSegment } from "./user-segmentation.service";
import { generatePersonalizedOffer } from "./personalization.service";

export type GrowthV4Input = {
  campaigns: CampaignBudgetInput[];
  geoData: GeoPerformanceRowInput[];
  user: UserSegmentSignals | null;
};

export type GrowthV4Result = {
  geoPerformance: ReturnType<typeof rankGeoPerformance>;
  budgetRecommendations: ReturnType<typeof recommendBudget>;
  geoBudgetSplit: ReturnType<typeof splitBudgetByGeo>;
  personalization: {
    segment: ReturnType<typeof detectUserSegment>;
    offer: ReturnType<typeof generatePersonalizedOffer>;
  };
  timestamp: string;
  /** Non-fatal degradation notes (empty when inputs are healthy). */
  warnings: string[];
};

export async function runGrowthV4(input: GrowthV4Input): Promise<GrowthV4Result> {
  const campaigns = input.campaigns ?? [];
  const geoData = input.geoData ?? [];
  const warnings: string[] = [];

  if (campaigns.length === 0) {
    warnings.push("No campaigns available — no UTM campaign rows with events in this window.");
  } else {
    const totalSpend = campaigns.reduce((s, c) => s + (typeof c.budget === "number" ? c.budget : 0), 0);
    if (totalSpend <= 0) {
      warnings.push("No attributed spend in window — CPL/ROAS signals are limited until manual spend is recorded.");
    }
  }

  if (geoData.length === 0) {
    warnings.push("No geo-grouped rows — regional heatmap and geo split stay empty until metadata includes country/city.");
  }

  const geoPerf = computeGeoPerformance(geoData);
  const rankedGeo = rankGeoPerformance(geoPerf);

  const budgetRecommendations = recommendBudget(campaigns);

  const totalBudget = campaigns.reduce((sum, c) => sum + (typeof c.budget === "number" && !Number.isNaN(c.budget) ? c.budget : 0), 0);
  const geoBudgetSplit = splitBudgetByGeo(totalBudget, rankedGeo);

  const segment = detectUserSegment(input.user);
  const offer = generatePersonalizedOffer(segment);

  logInfo("[growth-v4] orchestrator run", {
    geoBuckets: rankedGeo.length,
    campaigns: campaigns.length,
    segment,
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[V4] run complete", {
      campaigns: campaigns.length,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    geoPerformance: rankedGeo,
    budgetRecommendations,
    geoBudgetSplit,
    personalization: {
      segment,
      offer,
    },
    timestamp: new Date().toISOString(),
    warnings,
  };
}
