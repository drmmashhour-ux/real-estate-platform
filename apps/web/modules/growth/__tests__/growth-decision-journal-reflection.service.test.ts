import { describe, expect, it } from "vitest";
import { buildGrowthDecisionJournalReflections } from "../growth-decision-journal-reflection.service";
import type { GrowthDecisionJournalEntry } from "../growth-decision-journal.types";

describe("buildGrowthDecisionJournalReflections", () => {
  it("marks executed autopilot with conservative positive rationale", () => {
    const entries: GrowthDecisionJournalEntry[] = [
      {
        id: "e1",
        source: "autopilot",
        title: "X",
        summary: "s",
        decision: "executed",
        createdAt: "t",
      },
    ];
    const reflections = buildGrowthDecisionJournalReflections(entries, {
      adsPerformance: "OK",
      governanceStatus: null,
      executiveStatus: null,
      missionStatus: null,
      hotLeads: 0,
      dueNow: 0,
    });
    expect(reflections.some((r) => r.outcome === "positive")).toBe(true);
  });

  it("returns insufficient_data for rejected autopilot without extra claims", () => {
    const entries: GrowthDecisionJournalEntry[] = [
      {
        id: "e2",
        source: "autopilot",
        title: "Y",
        summary: "s",
        decision: "rejected",
        createdAt: "t",
      },
    ];
    const reflections = buildGrowthDecisionJournalReflections(entries, {
      adsPerformance: "STRONG",
      governanceStatus: null,
      executiveStatus: null,
      missionStatus: null,
      hotLeads: 0,
      dueNow: 0,
    });
    expect(reflections[0]?.outcome).toBe("insufficient_data");
  });
});
