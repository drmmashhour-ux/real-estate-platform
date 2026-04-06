import { describe, expect, it } from "vitest";
import { applyAutomationPolicy } from "../rules";
import { scoreGrowthLead } from "../lead-scorer";
import { scoreBuyerIntent } from "../buyer-intent-scorer";
import { detectOpportunities } from "../opportunity-detector";
import { generateAllRecommendations } from "../action-generator";
import { fingerprintFor } from "../persist";
import type { GrowthBrainSnapshot, GrowthLeadSummary, BuyerSessionSummary } from "../types";

const emptySnapshot = (): GrowthBrainSnapshot => ({
  generatedAt: new Date(),
  sparse: true,
  inventoryByCityCategory: [],
  demandByCityCategory: [],
  topConvertingListings: [],
  lowPerformingListings: [],
  staleGrowthLeads: [],
  hotGrowthLeads: [],
  highIntentBuyers: [],
  risingSegments: [],
  seoCoverageGaps: [],
  monetizationSignals: {
    avgUnlockStartToSuccessRatio: null,
    segmentsWithStrongUnlock: [],
    brokerHeavyCities: [],
  },
  globalHints: {
    totalActiveGrowthLeads: 0,
    totalBehaviorEvents7d: 0,
    totalListingAnalyticsRows: 0,
  },
});

describe("growth brain", () => {
  it("scores lead without crashing on sparse data", () => {
    const lead: GrowthLeadSummary = {
      id: "l1",
      role: "owner",
      city: "Montreal",
      category: "Condo",
      stage: "new",
      source: "form",
      permissionStatus: "unknown",
      needsFollowUp: false,
      updatedAt: new Date(),
      listingAcquisitionLeadId: null,
    };
    const s = scoreGrowthLead(lead, emptySnapshot());
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.tier).toMatch(/cold|warm|hot/);
  });

  it("scores buyer intent from session signals", () => {
    const session: BuyerSessionSummary = {
      sessionId: "s1",
      userId: null,
      listingViews: 12,
      uniqueListings: 5,
      saves: 2,
      contactClicks: 2,
      unlockStarts: 1,
      unlockSuccesses: 0,
      bookingAttempts: 0,
      mapClicks: 1,
      filterEvents: 2,
      positiveDwell: 1,
      cities: ["Montreal"],
    };
    const b = scoreBuyerIntent(session);
    expect(b.tier).toMatch(/browse|engaged|high_intent|ready/);
  });

  it("detectOpportunities returns sparse notice when empty", () => {
    const recs = detectOpportunities(emptySnapshot(), [], []);
    expect(recs.some((r) => r.type === "sparse_data_notice")).toBe(true);
  });

  it("generateAllRecommendations does not throw on sparse", () => {
    const recs = generateAllRecommendations(emptySnapshot(), [], []);
    expect(Array.isArray(recs)).toBe(true);
  });

  it("applyAutomationPolicy blocks auto on ASSIST", () => {
    const p = applyAutomationPolicy(
      {
        type: "test",
        domain: "content",
        priority: "low",
        confidence: 0.8,
        title: "t",
        description: "d",
        reasoning: "r",
        suggestedAction: "a",
        autoRunnable: true,
        requiresApproval: false,
        targetEntityType: null,
        targetEntityId: null,
        metadataJson: null,
      },
      "ASSIST"
    );
    expect(p.autoRunnable).toBe(false);
  });

  it("applyAutomationPolicy never auto-runs revenue", () => {
    const p = applyAutomationPolicy(
      {
        type: "unlock_price_test_candidate",
        domain: "revenue",
        priority: "medium",
        confidence: 0.5,
        title: "t",
        description: "d",
        reasoning: "r",
        suggestedAction: "a",
        autoRunnable: true,
        requiresApproval: false,
        targetEntityType: null,
        targetEntityId: null,
        metadataJson: null,
      },
      "SAFE_AUTOPILOT"
    );
    expect(p.autoRunnable).toBe(false);
    expect(p.requiresApproval).toBe(true);
  });

  it("fingerprintFor is stable", () => {
    const a = fingerprintFor({
      type: "x",
      domain: "seo",
      priority: "low",
      confidence: 0.5,
      title: "Hello",
      description: "",
      reasoning: "",
      suggestedAction: "",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: "Mtl",
      metadataJson: {},
    });
    const b = fingerprintFor({
      type: "x",
      domain: "seo",
      priority: "low",
      confidence: 0.5,
      title: "Hello",
      description: "",
      reasoning: "",
      suggestedAction: "",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: "Mtl",
      metadataJson: {},
    });
    expect(a).toBe(b);
  });
});
