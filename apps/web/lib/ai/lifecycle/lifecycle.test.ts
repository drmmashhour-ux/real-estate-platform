import { describe, expect, it } from "vitest";
import { suggestNextLeadActions } from "./lead-actions";
import { suggestDealActions, hintCrmStageFromDealStatus } from "./deal-actions";
import { RETENTION_TEMPLATE_KEYS, RETENTION_TEMPLATES } from "./retention-templates";

describe("suggestNextLeadActions", () => {
  it("suggests fast follow-up for hot new leads", () => {
    const a = suggestNextLeadActions({
      status: "new",
      score: 90,
      aiTier: "hot",
      lastFollowUpAt: null,
    });
    expect(a.some((x) => x.toLowerCase().includes("call"))).toBe(true);
  });

  it("suggests nurture for cold", () => {
    const a = suggestNextLeadActions({
      status: "new",
      score: 30,
      aiTier: "cold",
      lastFollowUpAt: null,
    });
    expect(a.some((x) => x.toLowerCase().includes("nurture"))).toBe(true);
  });
});

describe("deal actions", () => {
  it("hints CRM stage from legal status", () => {
    expect(hintCrmStageFromDealStatus("offer_submitted")).toBe("offer_made");
    expect(hintCrmStageFromDealStatus("closed")).toBe("closed");
  });

  it("suggests visit confirmation", () => {
    const a = suggestDealActions({ status: "initiated", crmStage: "visit_scheduled" });
    expect(a.join(" ").toLowerCase()).toMatch(/visit|confirm/);
  });
});

describe("retention templates", () => {
  it("covers 1w through 12m", () => {
    expect(RETENTION_TEMPLATE_KEYS.length).toBe(5);
    for (const k of RETENTION_TEMPLATE_KEYS) {
      expect(RETENTION_TEMPLATES[k].body.length).toBeGreaterThan(20);
      expect(RETENTION_TEMPLATES[k].complianceNote.length).toBeGreaterThan(10);
    }
  });
});
