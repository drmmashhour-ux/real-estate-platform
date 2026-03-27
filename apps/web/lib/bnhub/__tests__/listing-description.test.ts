import { describe, expect, it } from "vitest";
import { parseListingDescription } from "../listing-description";

describe("parseListingDescription", () => {
  it("returns empty for null", () => {
    expect(parseListingDescription(null)).toEqual({
      intro: "",
      bullets: [],
      fullDescription: "",
    });
  });

  it("parses intro and bullets", () => {
    const raw = `Bright loft near the river.

- Spacious living room
- Modern kitchen
- Quiet neighborhood

Extra details about parking and access.`;
    const r = parseListingDescription(raw);
    expect(r.intro).toContain("Bright loft");
    expect(r.bullets).toEqual(["Spacious living room", "Modern kitchen", "Quiet neighborhood"]);
    expect(r.fullDescription).toContain("Extra details");
  });
});
