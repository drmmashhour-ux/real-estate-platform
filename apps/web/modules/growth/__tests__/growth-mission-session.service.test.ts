import { describe, expect, it } from "vitest";
import { buildMissionControlActionBundle } from "../growth-mission-control-action.service";
import { buildMissionSession, summarizeMissionSession } from "../growth-mission-session.service";
import type { GrowthMissionControlSummary } from "../growth-mission-control.types";

const baseSummary = (): GrowthMissionControlSummary => ({
  status: "healthy",
  todayChecklist: ["Call broker leads", "Review fusion"],
  topRisks: [{ title: "Pipeline risk", severity: "medium", source: "governance", why: "Watch" }],
  humanReviewQueue: [],
  blockedDomains: [],
  frozenDomains: [],
  notes: [],
  createdAt: new Date().toISOString(),
});

describe("growth-mission-session.service", () => {
  it("is deterministic for same inputs", () => {
    const s = {
      ...baseSummary(),
      missionFocus: { title: "Focus", source: "fusion" as const, why: "why" },
    };
    const b = buildMissionControlActionBundle(s);
    const a = JSON.stringify(buildMissionSession(s, b));
    const c = JSON.stringify(buildMissionSession(s, b));
    expect(a).toBe(c);
  });

  it("places top action first when present", () => {
    const s = { ...baseSummary(), frozenDomains: ["ads"] };
    const b = buildMissionControlActionBundle(s);
    const ses = buildMissionSession(s, b);
    expect(ses.steps[0]?.type).toBe("top_action");
  });

  it("bounds step count", () => {
    const manyChecklist = Array.from({ length: 20 }, (_, i) => `item ${i}`);
    const manyRisks = Array.from({ length: 10 }, (_, i) => ({
      title: `R${i}`,
      severity: "high" as const,
      source: "x",
      why: "y",
    }));
    const s = {
      ...baseSummary(),
      todayChecklist: manyChecklist,
      topRisks: manyRisks,
    };
    const b = buildMissionControlActionBundle(s);
    const ses = buildMissionSession(s, b);
    expect(ses.steps.length).toBeLessThanOrEqual(10);
  });

  it("summarizes progress", () => {
    const s = baseSummary();
    const b = buildMissionControlActionBundle(s);
    const ses = buildMissionSession(s, b);
    ses.steps.forEach((st) => {
      st.completed = true;
    });
    const sum = summarizeMissionSession(ses);
    expect(sum.completedSteps).toBe(sum.totalSteps);
    expect(sum.remainingSteps).toBe(0);
  });
});
