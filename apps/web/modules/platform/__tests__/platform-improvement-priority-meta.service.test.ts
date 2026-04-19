import { describe, expect, it } from "vitest";
import { enrichPlatformImprovementPriority } from "../platform-improvement-priority-meta.service";

describe("enrichPlatformImprovementPriority", () => {
  it("maps monetization rows to revenue links deterministically", () => {
    const p = enrichPlatformImprovementPriority({
      title: "Monetization alignment",
      why: "Leakage between teaser and checkout.",
      expectedImpact: "Higher ARPU",
      category: "revenue",
      urgency: "high",
    });
    expect(p.executionLinks.some((l) => l.href.includes("/admin/growth"))).toBe(true);
    expect(p.executionLinks.some((l) => l.href.includes("/admin/growth-engine"))).toBe(true);
    expect(p.suggestedOwnerArea).toContain("growth");
  });

  it("maps trust pattern rows to TrustGraph / BNHub host surfaces", () => {
    const p = enrichPlatformImprovementPriority({
      title: "Trust pattern: verified_listing",
      why: "Badge consistency issues.",
      expectedImpact: "Trust",
      category: "trust",
      urgency: "medium",
    });
    expect(p.executionLinks.some((l) => l.href.includes("/admin/trustgraph"))).toBe(true);
    expect(p.executionLinks.some((l) => l.href.includes("/bnhub/host/dashboard"))).toBe(true);
  });
});
