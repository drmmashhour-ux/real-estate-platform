import { describe, expect, it } from "vitest";
import { discoverUndervaluedListings } from "../undervalued-listing.engine";
import { runEsgOpportunityEngine } from "../esg-opportunity.engine";
import { runInvestmentUpsideEngine } from "../investment-upside.engine";
import { compositeOpportunityScore, deriveConfidence, clampScore } from "../opportunity-scoring";
import { suggestedNextActionsForOpportunity } from "../opportunity-next-actions";
import type { OpportunityDiscoveryContext } from "../opportunity-context.service";
import { DEFAULT_OPPORTUNITY_WEIGHTS } from "../opportunity.types";

describe("opportunity discovery", () => {
  it("compositeOpportunityScore applies risk penalties", () => {
    const low = compositeOpportunityScore({ valueGap: 0.9, conversion: 0.8 }, "LOW", DEFAULT_OPPORTUNITY_WEIGHTS);
    const high = compositeOpportunityScore({ valueGap: 0.9, conversion: 0.8 }, "HIGH", DEFAULT_OPPORTUNITY_WEIGHTS);
    expect(high).toBeLessThan(low);
  });

  it("deriveConfidence respects data quality", () => {
    expect(deriveConfidence("high", 5)).toBeGreaterThan(deriveConfidence("low", 2));
  });

  it("clampScore bounds 0-100", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(222)).toBe(100);
  });

  it("suggestedNextActions includes advisory disclaimer", () => {
    const a = suggestedNextActionsForOpportunity("UNDERVALUED", "LISTING");
    expect(a.some((x) => /advisory|not investment advice/i.test(x))).toBe(true);
  });

  it("undervalued listing engine emits opportunity when price below median", () => {
    const ctx: OpportunityDiscoveryContext = {
      brokerUserId: "b1",
      listings: [
        {
          id: "l1",
          listingCode: "LST-1",
          title: "Test",
          price: 400_000,
          listingType: "HOUSE",
          complianceScore: 80,
          crmMarketplaceLive: true,
          createdAt: new Date(),
          esgComposite: null,
          esgRenovation: false,
          esgCoverage: null,
          medianPeerPrice: 500_000,
          priceRatioToMedian: 0.8,
        },
        {
          id: "l2",
          listingCode: "LST-2",
          title: "Peer",
          price: 500_000,
          listingType: "HOUSE",
          complianceScore: 75,
          crmMarketplaceLive: true,
          createdAt: new Date(),
          esgComposite: null,
          esgRenovation: false,
          esgCoverage: null,
          medianPeerPrice: 500_000,
          priceRatioToMedian: 1,
        },
      ],
      deals: [],
      strListings: [],
      investments: [],
      leads: [],
      recommendationIntentByListingId: {},
    };
    const rows = discoverUndervaluedListings(ctx, DEFAULT_OPPORTUNITY_WEIGHTS, {});
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.opportunityType).toBe("UNDERVALUED");
    expect(rows[0]?.rationale.riskFlags.length).toBeGreaterThanOrEqual(0);
  });

  it("ESG engine surfaces listing with weak composite and retrofit flag", () => {
    const ctx: OpportunityDiscoveryContext = {
      brokerUserId: "b1",
      listings: [
        {
          id: "l-esg",
          listingCode: "E1",
          title: "Retro candidate",
          price: 600_000,
          listingType: "HOUSE",
          complianceScore: 72,
          crmMarketplaceLive: true,
          createdAt: new Date(),
          esgComposite: 48,
          esgRenovation: true,
          esgCoverage: 52,
          medianPeerPrice: 600_000,
          priceRatioToMedian: 1,
        },
      ],
      deals: [],
      strListings: [],
      investments: [],
      leads: [],
      recommendationIntentByListingId: {},
    };
    const rows = runEsgOpportunityEngine(ctx, DEFAULT_OPPORTUNITY_WEIGHTS);
    expect(rows.length).toBe(1);
    expect(rows[0]?.opportunityType).toBe("ESG_UPSIDE");
    expect(rows[0]?.esgRelevant).toBe(true);
  });

  it("investment upside score increases when pipeline investments exist (fit proxy)", () => {
    const deal = {
      id: "d1",
      dealCode: "D-1",
      status: "ACTIVE",
      priceCents: 1_000_000_00,
      dealScore: 80,
      riskLevel: "LOW",
      closeProbability: 0.65,
      crmStage: "NEGOTIATION",
    };
    const base: OpportunityDiscoveryContext = {
      brokerUserId: "b1",
      listings: [],
      deals: [deal],
      strListings: [],
      investments: [],
      leads: [],
      recommendationIntentByListingId: {},
    };
    const boosted: OpportunityDiscoveryContext = {
      ...base,
      investments: [
        {
          id: "inv1",
          title: "Syndicate A",
          pipelineStage: "SCREEN",
          decisionStatus: "OPEN",
          listingId: null,
        },
      ],
    };
    const s0 = runInvestmentUpsideEngine(base, DEFAULT_OPPORTUNITY_WEIGHTS)[0]?.score ?? 0;
    const s1 = runInvestmentUpsideEngine(boosted, DEFAULT_OPPORTUNITY_WEIGHTS)[0]?.score ?? 0;
    expect(s1).toBeGreaterThan(s0);
  });
});
