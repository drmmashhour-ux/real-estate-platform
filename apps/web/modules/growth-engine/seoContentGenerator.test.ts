import { describe, expect, it } from "vitest";
import { generateSeoPageContentDraft } from "./seoContentGenerator";

describe("seoContentGenerator", () => {
  it("generates three non-empty pillars", () => {
    const d = generateSeoPageContentDraft("montreal", "buy");
    expect(d.blockBestProperties.length).toBeGreaterThan(40);
    expect(d.blockTopInvestment.length).toBeGreaterThan(40);
    expect(d.blockRentVsBuy.length).toBeGreaterThan(40);
    expect(d.keywords.join(" ")).toContain("Montreal");
  });
});
