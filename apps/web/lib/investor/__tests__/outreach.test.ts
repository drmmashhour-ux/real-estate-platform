import { describe, expect, it } from "vitest";

import { generateInvestorMessage } from "@/lib/investor/outreach";
import { INVESTOR_LEAD_STATUSES } from "@/lib/investor/investorLeadStatus";

describe("generateInvestorMessage (Order 51.1)", () => {
  it("uses the contact name in greeting", () => {
    const m = generateInvestorMessage("Alex");
    expect(m).toContain("Hi Alex");
    expect(m).toContain("LECIPM");
  });

  it("optional city + traction block when context provided", () => {
    const m = generateInvestorMessage("Pat", {
      cityFocus: "Montréal",
      earlyUserCount: 12,
      activeCampaignsCount: 3,
    });
    expect(m).toContain("Montréal");
    expect(m).toContain("~12");
    expect(m).toContain("3");
  });
});

describe("INVESTOR_LEAD_STATUSES", () => {
  it("has the five pipeline stages", () => {
    expect(INVESTOR_LEAD_STATUSES).toEqual(["new", "contacted", "replied", "meeting", "closed"]);
  });
});
