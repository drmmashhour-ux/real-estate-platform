import { describe, expect, it, beforeEach } from "vitest";
import { buildExecutionAccountabilityInsights } from "@/modules/growth/execution-accountability-insights.service";
import {
  buildExecutionAccountabilitySummary,
  clearChecklistCompletion,
  countExpectedDailyRoutineSlots,
  countExpectedMontrealDominationSlots,
  listChecklistCompletions,
  recordChecklistCompletion,
  recordPitchScriptUsage,
  resetExecutionAccountabilityForTests,
} from "@/modules/growth/execution-accountability.service";

describe("execution accountability service", () => {
  beforeEach(() => {
    resetExecutionAccountabilityForTests();
  });

  it("records completion and clear deterministically", () => {
    recordChecklistCompletion({
      surfaceType: "daily_routine",
      itemId: "d1-b0-a0",
      userId: "u1",
      completed: true,
      dayNumber: 1,
    });
    expect(listChecklistCompletions({ userId: "u1" })).toHaveLength(1);
    clearChecklistCompletion({
      surfaceType: "daily_routine",
      itemId: "d1-b0-a0",
      userId: "u1",
    });
    const row = listChecklistCompletions({ userId: "u1" })[0];
    expect(row.completed).toBe(false);
  });

  it("aggregates summary with low-data flag when sparse", () => {
    recordChecklistCompletion({
      surfaceType: "daily_routine",
      itemId: "d1-b0-a0",
      userId: "u1",
      completed: true,
      dayNumber: 1,
    });
    const s = buildExecutionAccountabilitySummary();
    expect(s.lowData).toBe(true);
    expect(s.byUser.length).toBe(1);
    expect(s.totalItems).toBeGreaterThan(0);
  });

  it("pitch usage appends events", () => {
    recordPitchScriptUsage({ variant: "60_sec", userId: "u1" });
    recordPitchScriptUsage({ variant: "5_min", userId: "u1" });
    const pitch = listChecklistCompletions({ surfaceType: "pitch_script" });
    expect(pitch.length).toBe(2);
    const s = buildExecutionAccountabilitySummary();
    expect(s.bySurface.find((x) => x.surfaceType === "pitch_script")?.completedItems).toBe(2);
  });

  it("template sizes are stable", () => {
    expect(countExpectedDailyRoutineSlots()).toBeGreaterThan(10);
    expect(countExpectedMontrealDominationSlots()).toBeGreaterThan(4);
  });
});

describe("execution accountability insights", () => {
  beforeEach(() => {
    resetExecutionAccountabilityForTests();
  });

  it("emits low-data insight when summary says lowData", () => {
    const s = buildExecutionAccountabilitySummary();
    const insights = buildExecutionAccountabilityInsights(s);
    expect(insights.some((i) => i.type === "low_data")).toBe(true);
  });

  it("pitch copy without daily routine triggers follow-through insight when pitch exists", () => {
    recordPitchScriptUsage({ variant: "60_sec", userId: "uPitch" });
    const s = buildExecutionAccountabilitySummary();
    const insights = buildExecutionAccountabilityInsights(s);
    expect(insights.some((i) => i.type === "pitch_no_followthrough")).toBe(true);
  });
});
