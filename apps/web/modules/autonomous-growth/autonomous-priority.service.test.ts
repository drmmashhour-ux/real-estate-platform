import { describe, expect, it } from "vitest";
import { buildPrioritizedAutonomousCandidates, scoreAutonomousCandidate } from "./autonomous-priority.service";
import type { OperatorScoredRecommendation } from "@/modules/operator/operator-v2.types";

describe("autonomous-priority.service", () => {
  it("scoreAutonomousCandidate returns priority score", () => {
    const s: OperatorScoredRecommendation = {
      id: "x",
      source: "ADS",
      actionType: "MONITOR",
      priorityScore: 42.5,
      trustScore: 0.7,
      reasons: [],
      warnings: [],
    };
    expect(scoreAutonomousCandidate(s)).toBe(42.5);
  });

  it("empty input yields empty output", async () => {
    const r = await buildPrioritizedAutonomousCandidates([]);
    expect(r.ordered).toEqual([]);
  });
});
