import { logInfo } from "@/lib/logger";
import type { BudgetAllocation, CampaignBudgetInput } from "./v4-types";
import {
  V4_MAX_BUDGET_INCREASE,
  V4_MIN_BUDGET_MAJOR,
  V4_MIN_CLICKS_TRUST,
  V4_MIN_IMPRESSIONS_TRUST,
  isTrustedVolume,
} from "./v4-safety";

const MIN_ROAS = 1.5;
const HIGH_ROAS = 3.0;

function clampRecommended(current: number, rawTarget: number): number {
  if (current <= 0) return 0;
  const maxUp = current * (1 + V4_MAX_BUDGET_INCREASE);
  const minDown = Math.max(V4_MIN_BUDGET_MAJOR, current * 0.5);
  let next = rawTarget;
  if (next > maxUp) next = maxUp;
  if (next < minDown) next = minDown;
  if (next < V4_MIN_BUDGET_MAJOR) next = V4_MIN_BUDGET_MAJOR;
  return Math.round(next * 100) / 100;
}

/**
 * ROAS-based budget suggestions. Requires sufficient volume; otherwise holds with low confidence.
 */
export function recommendBudget(campaigns: CampaignBudgetInput[]): BudgetAllocation[] {
  return campaigns.map((c) => {
    const trusted = isTrustedVolume(c.clicks, c.impressions);

    if (c.budget <= 0) {
      return {
        campaignId: c.id,
        currentBudget: 0,
        recommendedBudget: 0,
        adjustment: 0,
        confidence: 0.4,
        reason: "no_attributed_spend",
        trusted: false,
      };
    }

    if (!trusted) {
      const out: BudgetAllocation = {
        campaignId: c.id,
        currentBudget: c.budget,
        recommendedBudget: clampRecommended(c.budget, c.budget),
        adjustment: 0,
        confidence: 0.35,
        reason: "insufficient_volume_hold",
        trusted: false,
      };
      logInfo("[growth-v4] budget recommendation skipped (volume)", {
        campaignId: c.id,
        clicks: c.clicks,
        impressions: c.impressions,
        minClicks: V4_MIN_CLICKS_TRUST,
        minImpressions: V4_MIN_IMPRESSIONS_TRUST,
      });
      return out;
    }

    let adjustment = 0;
    let confidence = 0.5;
    let reason = "stable";

    if (c.roas >= HIGH_ROAS) {
      adjustment = +0.3;
      confidence = 0.9;
      reason = "high_roas_scale";
    } else if (c.roas >= MIN_ROAS) {
      adjustment = +0.15;
      confidence = 0.75;
      reason = "moderate_scale";
    } else if (c.roas < 1.0) {
      adjustment = -0.3;
      confidence = 0.85;
      reason = "unprofitable_reduce";
    } else {
      adjustment = -0.1;
      confidence = 0.6;
      reason = "low_efficiency";
    }

    const rawTarget = c.budget * (1 + adjustment);
    const recommendedBudget = clampRecommended(c.budget, rawTarget);
    const realizedAdjustment = c.budget > 0 ? (recommendedBudget - c.budget) / c.budget : 0;

    const out: BudgetAllocation = {
      campaignId: c.id,
      currentBudget: c.budget,
      recommendedBudget,
      adjustment: Math.round(realizedAdjustment * 1000) / 1000,
      confidence,
      reason,
      trusted: true,
    };

    logInfo("[growth-v4] budget recommendation", {
      campaignId: c.id,
      roas: c.roas,
      reason,
      adjustment: out.adjustment,
      trusted: true,
    });

    return out;
  });
}
