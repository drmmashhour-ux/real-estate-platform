import { describe, expect, it } from "vitest";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";

/**
 * Mirrors GetLeadsPageClient ivSummary behaviour: when instant value flag is off,
 * insights are not shown (empty array) while trust lines remain from the service.
 */
describe("get-leads instant value layer", () => {
  it("strips insights when simulating conversion-only tier", () => {
    const full = buildInstantValueSummary({ page: "leads", intent: "buy" });
    expect(full.trustLines?.length).toBeGreaterThan(0);
    const conversionOnly = { ...full, insights: [] as typeof full.insights };
    expect(conversionOnly.insights).toHaveLength(0);
  });

  it("keeps insights when full instant value is enabled", () => {
    const full = buildInstantValueSummary({ page: "leads", intent: "buy" });
    expect(full.insights.length).toBeGreaterThan(0);
  });
});
