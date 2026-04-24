import { describe, expect, it } from "vitest";
import type { NegotiationAiContext } from "@/modules/deal/negotiation-ai.engine";
import { generateOfferDraftFromContext } from "../auto-offer-generator.engine";
import type { OfferDraftContext } from "../offer-draft-context.service";

function ctx(over: Partial<OfferDraftContext> = {}): OfferDraftContext {
  const negotiationAi: NegotiationAiContext = {
    dealPriceCad: 500_000,
    listPriceCad: 525_000,
    comparableMedianCad: 510_000,
    comparableSampleSize: 10,
    buyerSellerMotivationNote: "Engaged",
    urgencyDaysSinceActivity: 3,
    priorOfferCount: 1,
    inspectionStress: "low",
    financingStrength: "moderate",
    dealStatus: "offer_submitted",
  };
  return {
    deal: {
      id: "d1",
      listingId: "l1",
      buyerId: "b1",
      brokerId: "br1",
      priceCents: 500_000_00,
      status: "offer_submitted",
      crmStage: "negotiation",
      executionMetadata: { offerFinancingDays: 18 },
      dealScore: 72,
      closeProbability: 0.55,
      riskLevel: "MEDIUM",
    },
    listing: {
      id: "l1",
      title: "Condo Montréal",
      priceCad: 525_000,
      listingType: "CONDO",
      listingCode: "LST-1",
    },
    buyer: { id: "b1", email: "b@x.com", homeCity: "Montréal" },
    negotiationAi,
    negotiationStrategies: [],
    dealScoreSnapshot: null,
    brokerDisclosureLine: null,
    requiresConflictClause: false,
    ...over,
  };
}

describe("generateOfferDraftFromContext", () => {
  it("defaults to balanced band and includes financing + inspection clauses", () => {
    const g = generateOfferDraftFromContext(ctx());
    expect(g.priceBandsJson.selected).toBe("BALANCED");
    expect(g.purchasePrice).toBe(g.priceBandsJson.balanced);
    expect(g.financingClauseText.toLowerCase()).toMatch(/financ/);
    expect(g.inspectionClauseText.toLowerCase()).toMatch(/inspect/);
    expect(Array.isArray(g.clauseWarningsJson)).toBe(true);
  });

  it("adds conflict clause when required", () => {
    const g = generateOfferDraftFromContext(ctx({ requiresConflictClause: true }));
    const spec = g.specialConditionsJson as { sourceRuleId: string }[];
    expect(spec.some((s) => s.sourceRuleId.includes("conflict"))).toBe(true);
  });

  it("embeds traceability sources in rationale", () => {
    const g = generateOfferDraftFromContext(ctx());
    const r = g.rationaleJson.fields.purchasePrice;
    expect(r.sources.some((s) => s.type === "negotiation_ai")).toBe(true);
    expect(r.sources.some((s) => s.ref.includes("listing"))).toBe(true);
  });
});
