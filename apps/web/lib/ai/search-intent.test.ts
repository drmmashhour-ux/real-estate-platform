import { describe, expect, it } from "vitest";
import { parseSearchIntent } from "./search-intent";

describe("parseSearchIntent", () => {
  it("parses cheap condo near metro (sale context)", () => {
    const r = parseSearchIntent("Cheap condo near metro", "sale");
    expect(r.context).toBe("sale");
    expect(r.suggestedFilters.propertyTypeHint).toBe("condo");
    expect(r.suggestedFilters.sort).toBe("price_asc");
    expect(r.suggestedFilters.priceMaxCents).toBe(350_000_00);
    expect(r.suggestedFilters.keywords).toContain("near_transit");
    expect(r.explanation.length).toBeGreaterThan(0);
  });

  it("uses nightly caps for BNHub-style search", () => {
    const r = parseSearchIntent("Cheap stay near metro", "nightly_stay");
    expect(r.context).toBe("nightly_stay");
    expect(r.suggestedFilters.priceMaxCents).toBe(150_00);
  });

  it("returns neutral explanation for empty patterns", () => {
    const r = parseSearchIntent("xyz");
    expect(r.explanation).toMatch(/manual filters|No strong intent/i);
  });
});
