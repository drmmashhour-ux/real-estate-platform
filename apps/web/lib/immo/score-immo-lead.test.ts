import { describe, it, expect } from "vitest";
import { scoreImmoLead } from "./score-immo-lead";

describe("scoreImmoLead", () => {
  it("boosts hot tier when buying soon and pre-approved", () => {
    const r = scoreImmoLead({
      name: "Test",
      email: "t@t.co",
      phone: "+15555550100",
      message: "Interested",
      smart: { buyingSoon: "within_30d", preApproved: "yes", budgetRange: "500_800k" },
    });
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.temperature).toBe("hot");
  });

  it("stays cooler when exploring only", () => {
    const r = scoreImmoLead({
      name: "Test",
      email: "t@t.co",
      phone: "+15555550100",
      message: "Hi",
      smart: { buyingSoon: "exploring", preApproved: "", budgetRange: "not_sure" },
    });
    expect(r.temperature).not.toBe("hot");
  });
});
