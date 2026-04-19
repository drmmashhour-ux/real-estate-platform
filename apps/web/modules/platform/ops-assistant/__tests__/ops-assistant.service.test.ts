import { beforeEach, describe, expect, it } from "vitest";
import { enrichPlatformImprovementPriority } from "../../platform-improvement-priority-meta.service";
import {
  resetOpsAssistantMonitoringForTests,
  getOpsAssistantMonitoringSnapshot,
  recordOpsAssistantConfirmed,
} from "../ops-assistant-monitoring.service";
import { buildCtaPrefill } from "../ops-assistant-prefill.service";
import { filterToSafeSuggestions } from "../ops-assistant-safety.service";
import { buildOpsSuggestions } from "../ops-assistant.service";

describe("ops-assistant.service", () => {
  beforeEach(() => {
    resetOpsAssistantMonitoringForTests();
  });

  it("builds deterministic prefills from templates + context only", () => {
    const p = enrichPlatformImprovementPriority({
      title: "Clarify primary CTA on key surfaces",
      why: "Hero competes with secondary actions.",
      expectedImpact: "Better conversion",
      category: "conversion",
      urgency: "medium",
    });
    const pre = buildCtaPrefill(p);
    expect(pre.text).toContain("Draft CTA");
    expect(pre.text).toContain(p.why.slice(0, 40));
  });

  it("emits only low-risk suggestions with confirmation", () => {
    const p = enrichPlatformImprovementPriority({
      title: "Trust pattern: verified_listing",
      why: "Badge inconsistency.",
      expectedImpact: "Trust",
      category: "trust",
      urgency: "medium",
    });
    const s = buildOpsSuggestions(p);
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(3);
    for (const x of s) {
      expect(x.riskLevel).toBe("low");
      expect(x.requiresConfirmation).toBe(true);
    }
    expect(s.some((x) => x.executable?.actionType)).toBe(true);
  });

  it("filters unsafe href patterns", () => {
    const bad = [
      {
        id: "x",
        priorityId: "p",
        title: "Pay",
        description: "x",
        actionType: "navigate" as const,
        targetSurface: "growth" as const,
        riskLevel: "low" as const,
        requiresConfirmation: true as const,
        href: "/admin/stripe-settings",
        queryParams: {},
      },
    ];
    expect(filterToSafeSuggestions(bad)).toHaveLength(0);
  });

  it("monitoring never throws and increments on record", () => {
    expect(() => recordOpsAssistantConfirmed("s1", "p1")).not.toThrow();
    const snap = getOpsAssistantMonitoringSnapshot();
    expect(snap.confirmations).toBeGreaterThanOrEqual(1);
  });
});
