import { describe, expect, it } from "vitest";
import { parseVariantStats } from "../domain/variantStats";

describe("parseVariantStats", () => {
  it("normalizes uses and replies", () => {
    const s = parseVariantStats({ a: { uses: 2, replies: 1 }, b: "bad" });
    expect(s.a).toEqual({ uses: 2, replies: 1 });
    expect(s.b).toBeUndefined();
  });

  it("returns empty for invalid json", () => {
    expect(parseVariantStats(null)).toEqual({});
    expect(parseVariantStats([])).toEqual({});
  });
});
