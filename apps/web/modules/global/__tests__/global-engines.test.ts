import { describe, expect, it } from "vitest";
import { evaluateRegulationSurface, listRegulationRulesForCountry } from "../regulation.engine";
import { buildEntryStrategyPlan, runPilotLaunchSequence, summarizeFeedbackLoop } from "../entry.engine";
import { resolveMarketLocalizationProfile } from "../localization.engine";
import { resetGlobalExpansionStateForTests } from "@/modules/global-expansion/global-country.service";

describe("regulation.engine", () => {
  it("returns rules and constraints for CA", () => {
    const r = evaluateRegulationSurface("CA");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rules.length).toBeGreaterThan(0);
      expect(r.constraints.some((c) => c.id.startsWith("cns-"))).toBe(true);
    }
  });

  it("lists rules including regulation view labels", () => {
    const rules = listRegulationRulesForCountry("CA");
    expect(rules.some((x) => x.kind === "allowed")).toBe(true);
  });
});

describe("entry.engine", () => {
  it("builds a bundle for CA", () => {
    const b = buildEntryStrategyPlan("CA");
    expect(b.countryCode).toBe("CA");
    expect(b.pilot.successCriteria.length).toBeGreaterThan(0);
    expect(b.feedback.channels.length).toBeGreaterThan(0);
  });

  it("summarizes feedback loop", () => {
    const s = summarizeFeedbackLoop("CA");
    expect(s).toContain("Bi-weekly");
  });
});

describe("localization.engine", () => {
  it("resolves profile for CA with currency", () => {
    const p = resolveMarketLocalizationProfile("CA", "en");
    expect(p.currency).toBe("CAD");
    expect(p.sampleMoneyFormatted).toMatch(/\d/);
  });
});

describe("entry.engine launch", () => {
  it("runPilotLaunchSequence returns result", () => {
    resetGlobalExpansionStateForTests();
    const r = runPilotLaunchSequence("CA");
    expect(r.ok).toBe(true);
    expect(r.audit.length).toBeGreaterThan(0);
  });
});
