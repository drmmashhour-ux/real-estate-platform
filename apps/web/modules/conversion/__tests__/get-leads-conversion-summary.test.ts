import { describe, expect, it } from "vitest";
import { resolveGetLeadsIvSummaryLayer } from "@/modules/conversion/get-leads-conversion-summary";

describe("resolveGetLeadsIvSummaryLayer", () => {
  it("returns null when conversion upgrade is off", () => {
    expect(resolveGetLeadsIvSummaryLayer(false, false, "buy")).toBeNull();
    expect(resolveGetLeadsIvSummaryLayer(false, true, "buy")).toBeNull();
  });

  it("conversion-only tier: headline + trust but no insights", () => {
    const s = resolveGetLeadsIvSummaryLayer(true, false, "buy");
    expect(s).not.toBeNull();
    expect(s!.insights).toHaveLength(0);
    expect(s!.headline.length).toBeGreaterThan(5);
    expect((s!.trustLines ?? []).length).toBeGreaterThan(0);
  });

  it("full instant value: insights present", () => {
    const s = resolveGetLeadsIvSummaryLayer(true, true, "buy");
    expect(s).not.toBeNull();
    expect(s!.insights.length).toBeGreaterThan(0);
  });
});
