import { BrokerAdSimulationCampaignStatus } from "@prisma/client";

export type AdPlatform = "tiktok" | "meta" | "google";

export const AUDIENCE_VALUES = ["buyer", "seller", "host", "broker"] as const;
export type CampaignAudience = (typeof AUDIENCE_VALUES)[number];

export type CreateBrokerCampaignInput = {
  userId: string;
  audience: string;
  city?: string | null;
  platform: AdPlatform;
  headline: string;
  body: string;
  /** Audit: "broker" (UI) vs "ai" (automation). */
  createdBy?: "broker" | "ai" | null;
};

/** Prisma `BrokerAdSimulationPerformance` + derived fields (38.1). */
export type PerformanceWithDerived = {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
};

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function roundNonNeg(n: number) {
  return Math.max(0, Math.round(n));
}

const ALLOWED: Record<BrokerAdSimulationCampaignStatus, BrokerAdSimulationCampaignStatus[]> = {
  [BrokerAdSimulationCampaignStatus.draft]: [BrokerAdSimulationCampaignStatus.scheduled],
  [BrokerAdSimulationCampaignStatus.scheduled]: [BrokerAdSimulationCampaignStatus.running],
  [BrokerAdSimulationCampaignStatus.running]: [BrokerAdSimulationCampaignStatus.completed],
  [BrokerAdSimulationCampaignStatus.completed]: [],
};

/**
 * Enforces: draft → scheduled → running → completed (only).
 * @throws Error with message `INVALID_CAMPAIGN_STATUS_TRANSITION` if disallowed
 */
export function assertCampaignStatusTransition(
  from: BrokerAdSimulationCampaignStatus,
  to: BrokerAdSimulationCampaignStatus
): void {
  const next = ALLOWED[from];
  if (!next?.includes(to)) {
    const err = new Error("INVALID_CAMPAIGN_STATUS_TRANSITION");
    (err as Error & { from?: string; to?: string }).from = from;
    (err as Error & { from?: string; to?: string }).to = to;
    throw err;
  }
}

export function derivePerformanceMetrics(perf: {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}): PerformanceWithDerived {
  const impressions = Math.max(0, perf.impressions);
  const clicks = Math.max(0, perf.clicks);
  const conversions = Math.max(0, perf.conversions);
  const spend = Number.isFinite(perf.spend) ? perf.spend : 0;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const conversionRate = clicks > 0 ? conversions / clicks : 0;
  const costPerConversion = conversions > 0 ? spend / conversions : null;
  return {
    impressions,
    clicks,
    conversions,
    spend,
    ctr,
    conversionRate,
    costPerConversion,
  };
}

/**
 * Deterministic, weighted random simulation (no live ad APIs). Platform and audience
 * set impression ranges, CTR %, CVR of clicks, and CPC.
 */
export function computeBrokerSimulationSample(platform: string, audience: string): {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
} {
  const p = platform.toLowerCase();
  let iMin: number;
  let iMax: number;
  let ctrMin: number;
  let ctrMax: number;
  let cpcMin: number;
  let cpcMax: number;
  if (p === "tiktok") {
    iMin = 1500;
    iMax = 6000;
    ctrMin = 0.02;
    ctrMax = 0.06;
    cpcMin = 0.5;
    cpcMax = 1.2;
  } else if (p === "meta") {
    iMin = 1000;
    iMax = 4000;
    ctrMin = 0.01;
    ctrMax = 0.04;
    cpcMin = 0.8;
    cpcMax = 1.5;
  } else {
    iMin = 500;
    iMax = 2500;
    ctrMin = 0.03;
    ctrMax = 0.08;
    cpcMin = 1.0;
    cpcMax = 2.5;
  }

  const a = audience.toLowerCase();
  let cvrMin: number;
  let cvrMax: number;
  if (a === "buyer") {
    cvrMin = 0.03;
    cvrMax = 0.07;
  } else if (a === "seller") {
    cvrMin = 0.02;
    cvrMax = 0.05;
  } else if (a === "host") {
    cvrMin = 0.04;
    cvrMax = 0.1;
  } else if (a === "broker") {
    cvrMin = 0.01;
    cvrMax = 0.03;
  } else {
    cvrMin = 0.02;
    cvrMax = 0.06;
  }

  const impressions = roundNonNeg(randBetween(iMin, iMax));
  const ctr = randBetween(ctrMin, ctrMax);
  const clicks = roundNonNeg(impressions * ctr);
  const cvr = randBetween(cvrMin, cvrMax);
  const conversions = roundNonNeg(clicks * cvr);
  const cpc = randBetween(cpcMin, cpcMax);
  const spend = clicks * cpc;
  return { impressions, clicks, conversions, spend };
}

/** Map API body platform string to allowed values. */
export function parseAdPlatform(raw: string): AdPlatform {
  const p = raw.toLowerCase();
  if (p === "tiktok" || p === "meta" || p === "google") return p;
  throw new Error("INVALID_PLATFORM");
}
