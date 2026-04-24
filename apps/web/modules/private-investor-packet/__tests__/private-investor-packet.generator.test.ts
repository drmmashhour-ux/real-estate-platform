import { describe, expect, it } from "vitest";
import type { PrivateInvestorPacketContext } from "../private-investor-packet-context.service";
import { compilePrivateInvestorPacketHtml, generatePrivateInvestorPacketSections } from "../private-investor-packet.generator";

const disclaimers = {
  privatePlacementOnly:
    "This materials package is for private placement discussions only. It is not an offer to sell or solicitation to buy securities to the public.",
  noGuaranteedReturns:
    "Past performance, illustrations, or scenarios are not guarantees of future results. Capital is at risk.",
  notPublicOffering:
    "This is not a prospectus and not filed with a securities regulator as a public offering document.",
};

function baseCtx(over: Partial<PrivateInvestorPacketContext> = {}): PrivateInvestorPacketContext {
  return {
    deal: {
      id: "deal-1",
      priceCents: 1_000_000_00,
      status: "NEGOTIATION",
      crmStage: "QUALIFIED",
      dealScore: 72,
      closeProbability: 0.42,
      riskLevel: "MEDIUM",
      listingId: "lst-1",
      listingCode: "LST",
      executionMetadata: null,
    },
    listing: {
      id: "lst-1",
      title: "Triplex Laval",
      price: 1_250_000,
      complianceScore: 80,
      esgComposite: 6.2,
    },
    dealScoreSnapshot: {
      score: 75,
      category: "BUY",
      riskLevel: "MEDIUM",
      strengths: ["Stable rent roll"],
      risks: ["Rate sensitivity"],
      recommendation: { action: "CONSIDER" } as unknown as string | null,
    },
    spv: { id: "spv-1", exemptionPath: "ACCREDITED_INVESTOR", privateExemptDealMode: true },
    investorUserId: "inv-1",
    disclaimers,
    ...over,
  };
}

describe("generatePrivateInvestorPacketSections", () => {
  it("includes underwriting, ESG, and risk disclosure content", () => {
    const s = generatePrivateInvestorPacketSections(baseCtx());
    expect(s.underwritingSummary.overallScore).toBe(75);
    expect(typeof s.underwritingSummary.recommendation).toBe("string");
    expect(s.underwritingSummary.majorRisks.length).toBeGreaterThan(0);
    expect(s.esgRetrofitSummary.esgScoreNote.toLowerCase()).toMatch(/esg/);
    expect(s.riskDisclosureSummary.liquidityRisk.length).toBeGreaterThan(0);
    expect(s.disclaimers.notPublicOffering.toLowerCase()).toMatch(/public offering/);
  });

  it("uses string recommendation when already a string", () => {
    const s = generatePrivateInvestorPacketSections(
      baseCtx({
        dealScoreSnapshot: {
          score: 1,
          category: null,
          riskLevel: null,
          strengths: [],
          risks: [],
          recommendation: "HOLD",
        },
      }),
    );
    expect(s.underwritingSummary.recommendation).toBe("HOLD");
  });
});

describe("compilePrivateInvestorPacketHtml", () => {
  it("embeds private placement framing (no public offering)", () => {
    const html = compilePrivateInvestorPacketHtml(generatePrivateInvestorPacketSections(baseCtx()));
    expect(html.toLowerCase()).toMatch(/private investor packet/);
    expect(html).toMatch(/not a prospectus/);
  });
});
