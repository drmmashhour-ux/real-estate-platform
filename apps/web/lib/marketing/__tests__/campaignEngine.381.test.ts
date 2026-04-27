import { describe, expect, it } from "vitest";

import { BrokerAdSimulationCampaignStatus } from "@prisma/client";

import {
  assertCampaignStatusTransition,
  computeBrokerSimulationSample,
  derivePerformanceMetrics,
} from "../campaignEnginePure";

describe("Order 38.1 — campaign engine safety", () => {
  it("derivePerformanceMetrics: no NaN, safe divisions", () => {
    const z = derivePerformanceMetrics({ impressions: 0, clicks: 0, conversions: 0, spend: 0 });
    expect(Number.isNaN(z.ctr)).toBe(false);
    expect(Number.isNaN(z.conversionRate)).toBe(false);
    expect(z.costPerConversion).toBeNull();

    const a = derivePerformanceMetrics({ impressions: 100, clicks: 5, conversions: 2, spend: 10 });
    expect(a.ctr).toBeCloseTo(0.05);
    expect(a.conversionRate).toBeCloseTo(0.4);
    expect(a.costPerConversion).toBeCloseTo(5);
  });

  it("assertCampaignStatusTransition: only allowed chain", () => {
    expect(() =>
      assertCampaignStatusTransition(
        BrokerAdSimulationCampaignStatus.draft,
        BrokerAdSimulationCampaignStatus.scheduled
      )
    ).not.toThrow();
    expect(() =>
      assertCampaignStatusTransition(
        BrokerAdSimulationCampaignStatus.draft,
        BrokerAdSimulationCampaignStatus.running
      )
    ).toThrow("INVALID_CAMPAIGN_STATUS_TRANSITION");
  });

  it("computeBrokerSimulationSample: produces finite, non-NaN numbers", () => {
    for (let i = 0; i < 20; i++) {
      const s = computeBrokerSimulationSample("tiktok", "buyer");
      for (const k of Object.keys(s) as (keyof typeof s)[]) {
        expect(Number.isFinite(s[k])).toBe(true);
        expect(Number.isNaN(s[k])).toBe(false);
      }
    }
  });
});
