import { describe, it, expect } from "vitest";
import { generateActions } from "@/src/modules/ai-operator/application/generateActions";

describe("generateActions", () => {
  it("includes run_simulation for deal_analysis with listingId", () => {
    const a = generateActions("deal_analysis", { listingId: "lst_1", dealScore: 70, trustScore: 80 });
    const sim = a.find((x) => x.type === "run_simulation");
    expect(sim).toBeDefined();
    expect(sim?.reason.length).toBeGreaterThan(10);
    expect(sim?.dataUsedSummary).toContain("listingId");
    expect(sim?.expectedOutcome).toBeDefined();
  });

  it("suggests adjust_price when deal score is low", () => {
    const a = generateActions("deal_analysis", { listingId: "x", dealScore: 40 });
    expect(a.some((x) => x.type === "adjust_price")).toBe(true);
  });

  it("produces lead action for lead_management", () => {
    const a = generateActions("lead_management", { leadId: "L1", daysSinceContact: 5 });
    expect(a.length).toBeGreaterThan(0);
    expect(["contact_lead", "follow_up_lead"]).toContain(a[0]!.type);
  });
});
