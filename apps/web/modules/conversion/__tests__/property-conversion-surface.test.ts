import { describe, expect, it } from "vitest";
import { recentViews24hFromActivityHint } from "@/modules/conversion/property-conversion-surface";

describe("recentViews24hFromActivityHint", () => {
  it("parses FSBO-format activity hints", () => {
    expect(recentViews24hFromActivityHint("5 people viewed this listing in the last 24 hours (unique sessions)")).toBe(
      5,
    );
  });

  it("parses CRM-format activity hints", () => {
    expect(recentViews24hFromActivityHint("Strong interest — 3+ unique views in the last 24 hours on LECIPM")).toBe(3);
  });

  it("returns null for unknown strings", () => {
    expect(recentViews24hFromActivityHint("Something vague happened")).toBeNull();
    expect(recentViews24hFromActivityHint(null)).toBeNull();
  });
});
