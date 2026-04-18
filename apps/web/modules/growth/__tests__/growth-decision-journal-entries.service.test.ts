import { describe, expect, it } from "vitest";
import { buildGrowthDecisionJournalEntries } from "../growth-decision-journal-entries.service";
import type { GrowthDecisionJournalBuildInput } from "../growth-decision-journal-build-input.types";

describe("buildGrowthDecisionJournalEntries", () => {
  it("builds bounded entries from partial inputs without mutating input", () => {
    const input: GrowthDecisionJournalBuildInput = {
      autopilot: {
        actions: [
          {
            id: "a1",
            title: "Follow hot lead",
            description: "x",
            source: "leads",
            impact: "high",
            confidence: 0.7,
            priorityScore: 80,
            why: "due",
            signalStrength: "strong",
            executionMode: "approval_required",
            createdAt: "t",
            status: "approved",
            executionStatus: "none",
          },
        ],
        autopilotStatus: "healthy",
        grouped: { ads: [], cro: [], leads: [] },
        focusTitle: null,
        panelSignalStrength: "medium",
      },
      executive: null,
      governance: null,
      strategyBundle: null,
      simulationBundle: null,
      missionControl: null,
      dailyBrief: null,
      coordination: null,
      missingDataWarnings: [],
    };
    const before = JSON.stringify(input);
    const entries = buildGrowthDecisionJournalEntries(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.decision).toBe("approved");
  });
});
