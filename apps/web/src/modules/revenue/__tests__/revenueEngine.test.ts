import { describe, expect, it } from "vitest";
import {
  getRevenuePushActionsForLead,
  simulateBookingOpportunityValue,
  simulateInquiryBrokerValue,
  simulatePremiumListingValue,
} from "../revenueEngine";

describe("revenueEngine simulations", () => {
  it("simulates booking opportunity value from intent", () => {
    expect(simulateBookingOpportunityValue(0)).toBeGreaterThan(80);
    expect(simulateBookingOpportunityValue(100)).toBeGreaterThan(simulateBookingOpportunityValue(0));
  });

  it("simulates inquiry / broker lead value from price", () => {
    expect(simulateInquiryBrokerValue(null)).toBe(250);
    expect(simulateInquiryBrokerValue(50_000)).toBe(500);
    expect(simulateInquiryBrokerValue(10_000_000)).toBe(5000);
  });

  it("simulates premium listing upgrade estimate", () => {
    expect(simulatePremiumListingValue()).toBe(199);
  });
});

describe("getRevenuePushActionsForLead", () => {
  it("suggests push booking while browsing", () => {
    const a = getRevenuePushActionsForLead("browsing");
    expect(a.some((x) => x.key === "push_booking")).toBe(true);
  });

  it("suggests lead purchase after inquiry", () => {
    const a = getRevenuePushActionsForLead("inquiry_sent");
    expect(a.some((x) => x.key === "encourage_lead_purchase")).toBe(true);
  });

  it("suggests upsell at high intent stages", () => {
    const a = getRevenuePushActionsForLead("negotiation");
    expect(a.some((x) => x.key === "upsell_premium_listing")).toBe(true);
  });
});
