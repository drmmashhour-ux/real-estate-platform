import { describe, expect, it } from "vitest";
import { generateListingDescriptionStub, listMarketingTemplateKeys } from "./marketing-engine";

describe("marketing-engine (no DB)", () => {
  it("lists known template keys", () => {
    const keys = listMarketingTemplateKeys();
    expect(keys).toContain("new_properties_area");
    expect(keys).toContain("price_drop");
  });

  it("builds listing description stub from facts only", () => {
    const text = generateListingDescriptionStub({
      title: "Sunset Loft",
      city: "Montreal",
      beds: 2,
      baths: 1,
      priceHint: "$450,000",
      highlights: ["Balcony", "Parking"],
    });
    expect(text).toContain("Sunset Loft");
    expect(text).toContain("Montreal");
    expect(text).toContain("450,000");
    expect(text).toContain("Balcony");
    expect(text).toMatch(/broker/i);
  });
});
