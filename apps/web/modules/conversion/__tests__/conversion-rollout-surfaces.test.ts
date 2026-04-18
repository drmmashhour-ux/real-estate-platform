import { describe, expect, it } from "vitest";
import {
  getLeadsInstantInsightsVisible,
  listingsInstantSummaryVisible,
  propertyRealUrgencyLinesVisible,
} from "@/modules/conversion/conversion-rollout-helpers";

/**
 * Mirrors product rules: explorer instant block and get-leads insights need upgrade + IV;
 * property urgency lines need upgrade + real urgency (insights still from instant value summary when upgrade on).
 */
describe("conversion rollout surface gating", () => {
  it("get-leads insights: only when upgrade AND instant value", () => {
    expect(getLeadsInstantInsightsVisible({ conversionUpgradeV1: true, instantValueV1: false, realUrgencyV1: false })).toBe(
      false,
    );
    expect(getLeadsInstantInsightsVisible({ conversionUpgradeV1: true, instantValueV1: true, realUrgencyV1: false })).toBe(
      true,
    );
  });

  it("listings explorer top instant summary: both upgrade and IV", () => {
    expect(listingsInstantSummaryVisible({ conversionUpgradeV1: true, instantValueV1: false, realUrgencyV1: false })).toBe(
      false,
    );
    expect(listingsInstantSummaryVisible({ conversionUpgradeV1: true, instantValueV1: true, realUrgencyV1: false })).toBe(true);
  });

  it("property real-urgency lines: upgrade + real urgency (IV not required for urgency stack)", () => {
    expect(
      propertyRealUrgencyLinesVisible({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: false,
      }),
    ).toBe(false);
    expect(
      propertyRealUrgencyLinesVisible({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: true,
      }),
    ).toBe(true);
  });
});
