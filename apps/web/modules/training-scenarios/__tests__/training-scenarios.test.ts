import { describe, expect, it } from "vitest";

import { evaluateLiveTurn } from "@/modules/live-training/live-feedback.engine";
import {
  appendScenarioUserTurn,
  getRandomScenario,
  getScenarioById,
  getScenariosByDifficulty,
  isDifficultyUnlocked,
  matchesScenarioSuccess,
  scoreScenarioTurn,
  startScenarioLiveSession,
} from "@/modules/training-scenarios";

describe("training-scenario.service + data", () => {
  it("loads scenario by id", () => {
    const s = getScenarioById("broker-cold-driver-easy");
    expect(s?.title).toBeTruthy();
    expect(s?.objections.length).toBeGreaterThan(0);
  });

  it("filters by difficulty", () => {
    const easy = getScenariosByDifficulty("EASY");
    expect(easy.every((x) => x.difficulty === "EASY")).toBe(true);
  });

  it("returns random scenario in pool", () => {
    const r = getRandomScenario("BROKER", "MEDIUM");
    expect(r.type).toBe("BROKER");
    expect(r.difficulty).toBe("MEDIUM");
  });
});

describe("scenario-session.engine", () => {
  it("starts with scenario opening line", () => {
    const s = getScenarioById("broker-cold-driver-easy")!;
    const session = startScenarioLiveSession(s);
    expect(session.messages[0]?.text).toBe(s.opening_line);
    expect(session.scenarioId).toBe(s.id);
  });

  it("detects broker demo success", () => {
    const s = getScenarioById("broker-cold-driver-easy")!;
    expect(matchesScenarioSuccess("Let’s book ten minutes tomorrow.", s)).toBe(true);
  });

  it("detects investor meeting success", () => {
    const s = getScenarioById("investor-analytical-easy")!;
    expect(matchesScenarioSuccess("Send a calendar invite for diligence.", s)).toBe(true);
  });

  it("runs scenario turn without throwing", () => {
    const s = getScenarioById("broker-cold-driver-easy")!;
    let state = startScenarioLiveSession(s);
    const step = appendScenarioUserTurn(state, "Thanks — quick question on lead quality.", false);
    expect(step.state.turn).toBe(1);
    expect(step.state.messages.length).toBeGreaterThan(2);
  });
});

describe("scenario-scoring.service", () => {
  it("scores dimensions", () => {
    const fb = evaluateLiveTurn("Fair question — what cohort do you measure?", "analytical_investor", 35);
    const dim = scoreScenarioTurn(fb, 22);
    expect(dim.composite).toBeGreaterThan(40);
    expect(dim.control).toBeGreaterThan(55);
  });
});

describe("scenario-progress.service", () => {
  it("always unlocks easy", () => {
    expect(isDifficultyUnlocked("EASY", { rollingAverageScore: 0, sessionCount: 0 })).toBe(true);
  });
});
