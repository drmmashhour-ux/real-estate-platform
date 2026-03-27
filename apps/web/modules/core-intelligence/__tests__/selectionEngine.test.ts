import { describe, expect, it } from "vitest";
import { selectBestActionsFromScores, selectBestStrategiesFromScores } from "@/src/core/intelligence/selection/selectionEngine";

describe("selectionEngine", () => {
  it("is deterministic for actions and strategies", () => {
    const scores = { dealScore: 82, trustScore: 71, riskScore: 26, confidenceScore: 74 };
    const actions = selectBestActionsFromScores("x", scores);
    const strategies = selectBestStrategiesFromScores("x", scores, 80);

    expect(actions[0]?.recommendedAction).toBe("contact_now");
    expect(selectBestActionsFromScores("x", scores)[0]?.recommendedAction).toBe("contact_now");
    expect(strategies[0]).toBeDefined();
  });
});
