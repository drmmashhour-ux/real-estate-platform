import { describe, expect, it } from "vitest";
import { computeHubJourneySignalConfidence } from "../hub-journey-confidence.service";

const base = { locale: "en", country: "ca" };

describe("computeHubJourneySignalConfidence", () => {
  it("returns low when almost no buyer signals", () => {
    expect(computeHubJourneySignalConfidence("buyer", base)).toBe("low");
  });

  it("returns higher confidence when buyer signals are populated", () => {
    const ctx = {
      ...base,
      userId: "user-1",
      buyerCitySelected: true,
      buyerBudgetSet: true,
      buyerBrowseSessions: 2,
      buyerShortlistCount: 1,
      buyerContactedSeller: true,
      buyerViewingScheduled: true,
      buyerOfferStarted: false,
    };
    expect(computeHubJourneySignalConfidence("buyer", ctx)).toBe("high");
  });
});
