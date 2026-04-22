import { describe, expect, it } from "vitest";

import {
  deriveSignalCountsFromEvents,
  materializeResidentDailySummary,
  type LoadedResidentSnapshot,
} from "../soins-ai-summary.service";

describe("soins-ai-summary.service", () => {
  const rid = "resident-snap-1";

  const emptySnapshot: LoadedResidentSnapshot = {
    events: [],
    chatMessagesRecent: [],
    cameraStreams: [],
  };

  it("materializeResidentDailySummary is deterministic for identical snapshots", () => {
    const a = materializeResidentDailySummary({
      residentId: rid,
      snapshot: emptySnapshot,
      generatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    const b = materializeResidentDailySummary({
      residentId: rid,
      snapshot: emptySnapshot,
      generatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    expect(a).toEqual(b);
  });

  it("deriveSignalCountsFromEvents maps emergency operational rows", () => {
    const counts = deriveSignalCountsFromEvents([
      {
        type: "EMERGENCY",
        severity: "HIGH",
        message: "Emergency button pressed — station 2",
        createdAt: new Date(),
      },
    ]);
    expect(counts.EMERGENCY_BUTTON).toBe(1);
  });

  it("meal workflow flags increment MISSED_MEAL", () => {
    const counts = deriveSignalCountsFromEvents([
      {
        type: "HEALTH",
        severity: "MEDIUM",
        message: "Breakfast meal missed — workflow check",
        createdAt: new Date(),
      },
    ]);
    expect(counts.MISSED_MEAL).toBe(1);
  });

  it("summary snapshot marks camera channels operational counts", () => {
    const snap: LoadedResidentSnapshot = {
      events: [],
      chatMessagesRecent: [],
      cameraStreams: [{ isActive: true }, { isActive: false }],
    };
    const vm = materializeResidentDailySummary({
      residentId: rid,
      snapshot: snap,
      generatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    expect(vm.cameraOperationalStatus).toContain("1 active");
    expect(vm.cameraOperationalStatus).toContain("2 configured");
  });

  it("operational summary language avoids clinical diagnosis terms", () => {
    const vm = materializeResidentDailySummary({
      residentId: rid,
      snapshot: emptySnapshot,
      generatedAt: new Date("2026-04-02T12:00:00.000Z"),
    });
    const blob = [
      vm.mealsOperationalStatus,
      vm.activityOperationalStatus,
      vm.nextFollowUpRecommendation,
    ]
      .join(" ")
      .toLowerCase();
    expect(blob).not.toContain("diagnos");
    expect(blob).not.toContain("cancer");
    expect(blob).not.toContain("prescribe");
  });
});
