import { describe, expect, it } from "vitest";
import { GoogleGeocodingAdapter } from "./googleGeocodingAdapter";

describe("GoogleGeocodingAdapter", () => {
  it("normalizes whitespace", () => {
    const a = new GoogleGeocodingAdapter();
    expect(a.normalizeAddress("  123  Main   St  ")).toBe("123 Main St");
  });

  it("flags city mismatch when locality differs", () => {
    const a = new GoogleGeocodingAdapter();
    const { mismatchFlags } = a.compareAddressComponents(
      { city: "Montreal", region: "QC", country: "CA" },
      {
        address_components: [
          { long_name: "Toronto", short_name: "Toronto", types: ["locality", "political"] },
          { long_name: "Ontario", short_name: "ON", types: ["administrative_area_level_1", "political"] },
          { long_name: "Canada", short_name: "CA", types: ["country", "political"] },
        ],
      }
    );
    expect(mismatchFlags).toContain("city_mismatch");
  });
});
