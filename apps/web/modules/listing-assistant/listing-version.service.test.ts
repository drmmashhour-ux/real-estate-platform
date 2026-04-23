import { describe, expect, it } from "vitest";

import { compareListingContentSnapshots } from "./listing-version.service";

describe("compareListingContentSnapshots", () => {
  it("detects title change", () => {
    const r = compareListingContentSnapshots({
      from: {
        title: "A",
        description: "hello",
        propertyHighlights: ["1"],
        language: "en",
      },
      to: {
        title: "B",
        description: "hello",
        propertyHighlights: ["1"],
        language: "en",
      },
    });
    expect(r.segments.find((s) => s.field === "title")?.kind).toBe("changed");
  });
});
