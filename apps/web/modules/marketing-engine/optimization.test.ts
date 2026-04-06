import { describe, expect, it } from "vitest";
import { MARKETING_OPTIMIZATION_NOTE_KEYS, suggestMarketingOptimization } from "./optimization";

describe("suggestMarketingOptimization", () => {
  it("returns defaults when empty", () => {
    const h = suggestMarketingOptimization([]);
    expect(h.boostTopics.length).toBeGreaterThan(0);
    expect(h.suggestedSocialPerDay).toBeGreaterThan(0);
    expect(h.noteKey).toBe(MARKETING_OPTIMIZATION_NOTE_KEYS.noHistory);
  });

  it("ranks topics by weighted score", () => {
    const h = suggestMarketingOptimization([
      { topicKey: "a", type: "social", clicks: 0, engagements: 0, conversions: 2 },
      { topicKey: "b", type: "social", clicks: 10, engagements: 0, conversions: 0 },
    ]);
    expect(h.boostTopics).toContain("a");
    expect(h.noteKey).toBe(MARKETING_OPTIMIZATION_NOTE_KEYS.weightedScores);
  });
});
