import { describe, expect, it } from "vitest";
import {
  formatBrokerBillingBlockReason,
  isBrokerBillingBlockedMessage,
  parseBrokerBillingBlockReason,
} from "./brokerLeadBilling";

describe("brokerLeadBilling gate messages", () => {
  it("formats and parses blocked reasons", () => {
    const msg = formatBrokerBillingBlockReason("max_unpaid_leads");
    expect(isBrokerBillingBlockedMessage(msg)).toBe(true);
    expect(parseBrokerBillingBlockReason(msg)).toBe("max_unpaid_leads");
  });

  it("does not flag unrelated errors", () => {
    expect(isBrokerBillingBlockedMessage("random")).toBe(false);
  });
});
