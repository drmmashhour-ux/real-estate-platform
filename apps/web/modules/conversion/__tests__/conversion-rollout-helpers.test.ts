import { describe, expect, it } from "vitest";
import {
  conversionExperienceTierLabel,
  deriveConversionExperienceTier,
  getLeadsInstantInsightsVisible,
  listingsInstantSummaryVisible,
  propertyRealUrgencyLinesVisible,
} from "@/modules/conversion/conversion-rollout-helpers";

describe("conversion-rollout-helpers", () => {
  it("deriveConversionExperienceTier matches flag combinations", () => {
    expect(
      deriveConversionExperienceTier({
        conversionUpgradeV1: false,
        instantValueV1: false,
        realUrgencyV1: false,
      }),
    ).toBe("base");

    expect(
      deriveConversionExperienceTier({
        conversionUpgradeV1: true,
        instantValueV1: false,
        realUrgencyV1: false,
      }),
    ).toBe("conversion_only");

    expect(
      deriveConversionExperienceTier({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: false,
      }),
    ).toBe("conversion_and_instant_value");

    expect(
      deriveConversionExperienceTier({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: true,
      }),
    ).toBe("conversion_instant_value_urgency");
  });

  it("surface visibility mirrors product rules", () => {
    expect(
      listingsInstantSummaryVisible({
        conversionUpgradeV1: true,
        instantValueV1: false,
        realUrgencyV1: false,
      }),
    ).toBe(false);

    expect(
      listingsInstantSummaryVisible({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: false,
      }),
    ).toBe(true);

    expect(
      getLeadsInstantInsightsVisible({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: false,
      }),
    ).toBe(true);

    expect(
      getLeadsInstantInsightsVisible({
        conversionUpgradeV1: true,
        instantValueV1: false,
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

  it("conversionExperienceTierLabel returns readable strings", () => {
    expect(conversionExperienceTierLabel("conversion_only").length).toBeGreaterThan(10);
  });
});
