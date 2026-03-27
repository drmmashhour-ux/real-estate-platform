import { describe, expect, it } from "vitest";
import { generateDMVariants } from "../domain/dmVariants";

describe("generateDMVariants", () => {
  it("returns three variants A/B/C with fallbacks when DB empty", () => {
    const v = generateDMVariants([], {});
    expect(v).toHaveLength(3);
    expect(v.map((x) => x.label)).toEqual(["A", "B", "C"]);
    expect(v[0].variantKey).toBe("curiosity");
    expect(v[0].text.length).toBeGreaterThan(20);
  });

  it("merges stats by variant key", () => {
    const v = generateDMVariants(
      [{ variant: "curiosity", body: "Custom A" }],
      { curiosity: { uses: 2, replies: 1 } }
    );
    expect(v[0].text).toBe("Custom A");
    expect(v[0].uses).toBe(2);
    expect(v[0].replies).toBe(1);
  });
});
