import { describe, expect, it } from "vitest";
import { resolveGetLeadsIvSummaryLayer } from "@/modules/conversion/get-leads-conversion-summary";

/**
 * Mirrors GetLeadsPageClient ivSummary behaviour: when instant value flag is off,
 * insights are not shown (empty array) while trust lines remain from the service.
 */
describe("get-leads instant value layer", () => {
  it("strips insights when simulating conversion-only tier", () => {
    const conversionOnly = resolveGetLeadsIvSummaryLayer(true, false, "buy");
    expect(conversionOnly?.trustLines?.length).toBeGreaterThan(0);
    expect(conversionOnly?.insights).toHaveLength(0);
  });

  it("keeps insights when full instant value is enabled", () => {
    const full = resolveGetLeadsIvSummaryLayer(true, true, "buy");
    expect(full?.insights.length).toBeGreaterThan(0);
  });
});
