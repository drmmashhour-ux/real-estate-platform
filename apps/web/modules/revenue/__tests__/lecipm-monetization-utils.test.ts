import { describe, expect, it } from "vitest";

import { suggestedBrokerSuccessBonusCents, LECIPM_PRICING_CONFIG } from "@/modules/pricing/pricing.config";
import { hubKindFromSubscriptionMetadata } from "../lecipm-monetization-summary.service";

describe("suggestedBrokerSuccessBonusCents", () => {
  it("applies configured rate to platform fee cents", () => {
    const rate = LECIPM_PRICING_CONFIG.commissions.brokerSuccessBonusRateOfPlatformFee;
    const platform = 10_000; // $100.00
    expect(suggestedBrokerSuccessBonusCents(platform)).toBe(Math.round(platform * rate));
  });
});

describe("hubKindFromSubscriptionMetadata", () => {
  it("returns null for empty", () => {
    expect(hubKindFromSubscriptionMetadata(null)).toBeNull();
  });

  it("parses lecipmHubKind", () => {
    expect(
      hubKindFromSubscriptionMetadata({ lecipmHubKind: "investor" }),
    ).toBe("investor");
  });
});
