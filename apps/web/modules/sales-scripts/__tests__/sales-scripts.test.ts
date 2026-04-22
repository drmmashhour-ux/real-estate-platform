import { describe, expect, it } from "vitest";

import {
  generateBrokerColdCallScript,
  generateInvestorClosingScript,
  generateInvestorPitchScript,
  getScriptByCategory,
} from "@/modules/sales-scripts/sales-script.service";
import { getVariantMetadata } from "@/modules/sales-scripts/sales-script-variants.service";

describe("sales-script generation", () => {
  it("returns broker cold call structure with base opening", () => {
    const r = generateBrokerColdCallScript({
      audience: "BROKER",
      contactName: "Sam",
      performanceTier: "average",
    });
    expect(r.opening_line).toContain("Sam");
    expect(r.opening_line).toContain("buyer leads");
    expect(r.discovery_questions.length).toBeGreaterThan(0);
    expect(r.objection_handling.length).toBeGreaterThanOrEqual(2);
    expect(r.fallback_lines.length).toBeGreaterThan(0);
  });

  it("returns investor pitch with pitch points", () => {
    const r = generateInvestorPitchScript({ audience: "INVESTOR" });
    expect(r.pitch_points?.length).toBeGreaterThan(0);
    expect(r.closing_line.toLowerCase()).toContain("week");
  });

  it("getScriptByCategory dispatches", () => {
    const s = getScriptByCategory("closing_investor", { audience: "INVESTOR" });
    expect(s.id).toBe("closing_investor");
  });
});

describe("variants", () => {
  it("tags top broker variant", () => {
    const k = getVariantMetadata({
      audience: "BROKER",
      performanceTier: "top",
    });
    expect(k).toBe("top_broker");
  });

  it("adjusts hook for junior broker without inventing metrics", () => {
    const r = generateBrokerColdCallScript({
      audience: "BROKER",
      performanceTier: "new",
    });
    expect(r.hook.length).toBeGreaterThan(20);
    expect(r.rep_reminder?.toLowerCase()).toContain("factual");
  });
});

describe("investor closing", () => {
  it("keeps diligence-safe tone", () => {
    const r = generateInvestorClosingScript({ audience: "INVESTOR" });
    expect(r.value_proposition.toLowerCase()).toMatch(/observable|exports|product/i);
  });
});
