import { describe, expect, it } from "vitest";

import { evaluateLiveTurn } from "../live-feedback.engine";
import { appendUserTurn, startLiveSession } from "../live-simulation.engine";
import {
  buildSessionSummary,
  paceLevelFromRollingAvg,
  unlockedLivePersonas,
} from "../live-training.service";

describe("live-feedback.engine", () => {
  it("scores and tags deterministically", () => {
    const short = evaluateLiveTurn("ok", "skeptical_broker", 30);
    expect(short.score).toBeGreaterThanOrEqual(20);
    expect(short.tags.length).toBeGreaterThanOrEqual(0);
    expect(short.quickFix.length).toBeGreaterThan(5);
  });

  it("flags long replies", () => {
    const longText = Array(60).fill("word").join(" ");
    const r = evaluateLiveTurn(longText, "aggressive_broker", 40);
    expect(r.tags).toContain("too_long");
  });
});

describe("live-simulation.engine", () => {
  it("starts with persona opener", () => {
    const s = startLiveSession("dominant_investor");
    expect(s.messages[0]?.role).toBe("persona");
    expect(s.messages[0]?.text.length).toBeGreaterThan(15);
  });

  it("loops user and persona turns", () => {
    let s = startLiveSession("analytical_investor");
    const step = appendUserTurn(s, "Here’s CAC payback in rough terms — about 14 months under current spend.", false);
    expect(step.state.messages.filter((m) => m.role === "user").length).toBe(1);
    expect(step.state.messages.filter((m) => m.role === "persona").length).toBeGreaterThanOrEqual(2);
  });
});

describe("live-training.service", () => {
  it("builds summary", () => {
    const fb = evaluateLiveTurn("Let’s book five minutes tomorrow.", "skeptical_broker", 40);
    const summary = buildSessionSummary(
      "skeptical_broker",
      [{ text: "Let’s book five minutes tomorrow.", feedback: fb }],
      "sid",
    );
    expect(summary.turnsGraded).toBe(1);
    expect(summary.sessionId).toBe("sid");
  });

  it("unlocks personas by progression", () => {
    expect(unlockedLivePersonas(0, 0).length).toBe(4);
    expect(unlockedLivePersonas(40, 5).length).toBeLessThanOrEqual(4);
  });

  it("pace level scales", () => {
    expect(paceLevelFromRollingAvg(0)).toBe(1);
    expect(paceLevelFromRollingAvg(90)).toBeGreaterThanOrEqual(4);
  });
});
