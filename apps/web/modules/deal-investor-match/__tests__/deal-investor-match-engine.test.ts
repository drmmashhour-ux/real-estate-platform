import { describe, expect, it } from "vitest";
import type { DealMatchContext } from "../deal-investor-match-engine.service";
import { scoreDealInvestorFit } from "../deal-investor-match-engine.service";

function ctx(over: Partial<DealMatchContext> = {}): DealMatchContext {
  return {
    dealId: "d1",
    buyerId: "buy",
    sellerId: "sell",
    priceCents: 2_000_000_00,
    riskLevel: "MEDIUM",
    executionMetadata: { investmentTargetCents: 400_000_00 },
    listing: {
      id: "lst1",
      title: "Triplex value-add Laval",
      listingType: "HOUSE",
      esgComposite: 6.1,
    },
    retrofitScenarioCount: 1,
    ...over,
  };
}

describe("scoreDealInvestorFit", () => {
  it("ranks higher when ticket, geo, risk, and ESG align", () => {
    const suit = {
      minTicketCents: 100_000_00,
      maxTicketCents: 2_000_000_00,
      preferredCities: ["Laval"],
      riskTolerance: "medium",
      esgFocus: true,
      strategies: ["value_add"],
    };
    const r = scoreDealInvestorFit(ctx(), suit);
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.fitReasons.some((x) => /ticket/i.test(x))).toBe(true);
    expect(r.fitReasons.some((x) => /laval/i.test(x))).toBe(true);
    expect(r.fitReasons.some((x) => /esg/i.test(x))).toBe(true);
    expect(r.penalties).not.toContain("ticket_mismatch");
  });

  it("applies mismatch penalties for ticket and risk", () => {
    const suit = {
      minTicketCents: 5_000_000_00,
      maxTicketCents: 8_000_000_00,
      riskTolerance: "low",
    };
    const r = scoreDealInvestorFit(ctx({ riskLevel: "HIGH" }), suit);
    expect(r.penalties).toContain("ticket_mismatch");
    expect(r.penalties).toContain("risk_mismatch");
    expect(r.score).toBeLessThan(55);
  });

  it("includes narrative explanations (non-empty)", () => {
    const r = scoreDealInvestorFit(ctx(), { riskTolerance: "medium" });
    expect(r.fitReasons.length).toBeGreaterThan(0);
  });
});
