import { describe, expect, it } from "vitest";
import {
  generateCityInsights,
  generateInvestmentTips,
  generateMarketUpdate,
  generatePropertyHighlights,
  toSocialSnippet,
} from "./contentEngine";

describe("marketing-engine contentEngine", () => {
  it("generatePropertyHighlights includes city and URL", () => {
    const t = generatePropertyHighlights({ city: "Montreal", listingTitle: "Loft", listingPath: "/listings/x" });
    expect(t).toContain("Montreal");
    expect(t).toContain("/listings/x");
  });

  it("generateCityInsights references hub slug", () => {
    const t = generateCityInsights("montreal");
    expect(t).toMatch(/montreal/i);
    expect(t).toContain("/city/montreal");
  });

  it("generateInvestmentTips includes region hint", () => {
    const t = generateInvestmentTips("miami");
    expect(t).toMatch(/miami/i);
    expect(t).toMatch(/US|investment/i);
  });

  it("generateMarketUpdate is dated", () => {
    const t = generateMarketUpdate("quebec");
    expect(t).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("toSocialSnippet truncates", () => {
    const long = "a".repeat(300);
    expect(toSocialSnippet(long, 50).length).toBeLessThanOrEqual(50);
  });
});
