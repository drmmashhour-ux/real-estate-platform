import { describe, it, expect } from "vitest";
import { estimatePublicPropertyValue } from "@/lib/valuation/public-mvp";

describe("estimatePublicPropertyValue", () => {
  it("uses Montreal band: mid × sqft; min/max from band edges", () => {
    const r = estimatePublicPropertyValue({
      address: "1 Main",
      city: "Montreal",
      propertyType: "House",
      bedrooms: 3,
      bathrooms: 2,
      surfaceSqft: 1000,
    });
    expect(r.cityKey).toBe("montreal");
    expect(r.estimatedValue).toBe(500_000);
    expect(r.rangeMin).toBe(400_000);
    expect(r.rangeMax).toBe(600_000);
    expect(r.estimatedValue).toBe(r.estimate);
    expect(r.rangeMin).toBe(r.minValue);
    expect(r.rangeMax).toBe(r.maxValue);
    expect(r.engine).toBe("mvp-rules");
  });

  it("uses Quebec band 250–450 $/sqft", () => {
    const r = estimatePublicPropertyValue({
      address: "x",
      city: "Quebec",
      propertyType: "Condo",
      bedrooms: 2,
      bathrooms: 1,
      surfaceSqft: 1000,
    });
    expect(r.cityKey).toBe("quebec");
    expect(r.estimatedValue).toBe(350_000);
    expect(r.rangeMin).toBe(250_000);
    expect(r.rangeMax).toBe(450_000);
  });

  it("detects Laval", () => {
    const r = estimatePublicPropertyValue({
      address: "x",
      city: "Laval",
      propertyType: "Condo",
      bedrooms: 2,
      bathrooms: 1,
      surfaceSqft: 800,
    });
    expect(r.cityKey).toBe("laval");
  });
});
