import { describe, expect, it } from "vitest";
import { searchQuerySuggestions } from "./search-autocomplete";

describe("searchQuerySuggestions", () => {
  it("returns popular intents for short query", () => {
    const s = searchQuerySuggestions("", 4);
    expect(s.length).toBe(4);
    expect(s.some((x) => x.includes("metro"))).toBe(true);
  });

  it("filters by substring", () => {
    const s = searchQuerySuggestions("cheap", 10);
    expect(s.every((x) => x.toLowerCase().includes("cheap"))).toBe(true);
  });
});
