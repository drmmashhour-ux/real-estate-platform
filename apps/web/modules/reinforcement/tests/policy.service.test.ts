import { describe, expect, it } from "vitest";
import {
  computeExplorationDecision,
  computeUcbLiteScore,
  selectStrategyFromScores,
} from "../policy.service";
import type { ReinforcementCandidate } from "../reinforcement.types";

describe("computeExplorationDecision", () => {
  it("explores when audit roll is below epsilon (bounded)", () => {
    expect(computeExplorationDecision(0.1, 0.05).explore).toBe(true);
    expect(computeExplorationDecision(0.1, 0.2).explore).toBe(false);
  });
});

describe("computeUcbLiteScore", () => {
  it("rises with lower pulls (exploration bonus)", () => {
    const lowPulls = computeUcbLiteScore(0.5, 1, 20, 10);
    const highPulls = computeUcbLiteScore(0.5, 20, 20, 10);
    expect(lowPulls).toBeGreaterThan(highPulls);
  });
});

describe("selectStrategyFromScores", () => {
  const cands: ReinforcementCandidate[] = [
    { strategyKey: "a", baseScore: 0.3 },
    { strategyKey: "b", baseScore: 0.7 },
  ];
  const scores = (keys: { key: string; base: number; sc: number }[]) =>
    keys.map((k, i) => ({ key: k.key, baseScore: k.base, score: k.sc, index: i }));

  it("exploit picks top score for epsilon-greedy", () => {
    const r = selectStrategyFromScores(
      scores([
        { key: "a", base: 0.3, sc: 0.4 },
        { key: "b", base: 0.7, sc: 0.9 },
      ]),
      cands,
      { policyType: "EPSILON_GREEDY", explorationRate: 0.0 },
      10,
      0,
      0.5
    );
    expect(r.selectedStrategyKey).toBe("b");
    expect(r.selectionMode).toBe("exploit");
  });

  it("with exploration, picks a candidate from the scored set (all allowed)", () => {
    const r = selectStrategyFromScores(
      scores([
        { key: "a", base: 0.3, sc: 0.4 },
        { key: "b", base: 0.7, sc: 0.9 },
      ]),
      cands,
      { policyType: "EPSILON_GREEDY", explorationRate: 1.0 },
      10,
      0,
      0.1
    );
    expect(r.selectionMode).toBe("explore");
    expect(["a", "b"]).toContain(r.selectedStrategyKey);
  });
});
