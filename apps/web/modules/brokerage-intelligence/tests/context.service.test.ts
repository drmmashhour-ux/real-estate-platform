import { describe, expect, it } from "vitest";
import { buildPortfolioContextBucketForLead, buildPortfolioContextBucket } from "../context.service";
import type { DealPortfolioSlice, LeadPortfolioSlice } from "../brokerage-intelligence.types";

describe("buildPortfolioContextBucket", () => {
  it("is stable for the same lead slice", () => {
    const l: LeadPortfolioSlice = {
      id: "l1",
      location: "montreal",
      estimatedValue: 450_000,
      leadType: "buyer",
      leadSource: "listing",
    };
    const a = buildPortfolioContextBucketForLead(l);
    const b = buildPortfolioContextBucketForLead(l);
    expect(a).toBe(b);
  });

  it("distinguishes deal from lead (priceCents on deal)", () => {
    const d: DealPortfolioSlice = {
      id: "d1",
      priceCents: 1_000_00,
      status: "initiated",
      lastUpdatedAt: new Date(),
    };
    const b = buildPortfolioContextBucket(d);
    expect(b).toContain("deal");
  });
});
