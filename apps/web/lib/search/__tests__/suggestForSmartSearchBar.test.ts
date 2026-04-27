import { describe, expect, it } from "vitest";

import { boostListingsByPreferredCities, type SuggestListingRow } from "../suggestBoost";

describe("Order 41 — suggest boost", () => {
  it("boosts preferred cities to the top", () => {
    const rows: SuggestListingRow[] = [
      { id: "1", title: "A", city: "Toronto", price: 100 },
      { id: "2", title: "B", city: "Montréal", price: 200 },
      { id: "3", title: "C", city: "Québec", price: 150 },
    ];
    const out = boostListingsByPreferredCities(rows, ["montréal"]);
    expect(out[0]?.city).toBe("Montréal");
  });

  it("no crash with empty query path (no preferred)", () => {
    const rows: SuggestListingRow[] = [
      { id: "1", title: "A", city: "X", price: 1 },
      { id: "2", title: "B", city: "Y", price: 2 },
    ];
    const out = boostListingsByPreferredCities(rows, []);
    expect(out).toHaveLength(2);
  });
});
