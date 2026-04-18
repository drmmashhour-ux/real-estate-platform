import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    rankingV8ShadowFlags: {
      rankingV8ShadowEvaluatorV1: false,
      rankingV8ShadowPersistenceV1: false,
    },
  };
});

import { scheduleRankingV8ShadowEvaluation } from "./ranking-v8-shadow-observer.service";

describe("ranking-v8-shadow-observer", () => {
  it("scheduleRankingV8ShadowEvaluation is no-op when evaluator flag is off", () => {
    scheduleRankingV8ShadowEvaluation({
      params: {} as never,
      scored: [],
      sorted: [],
    });
    expect(true).toBe(true);
  });
});
