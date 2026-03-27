import { describe, expect, it } from "vitest";
import { reviewActionBodySchema } from "@/lib/trustgraph/infrastructure/validation/reviewActionSchema";

describe("reviewActionBodySchema", () => {
  it("requires newOverallScore for override_score", () => {
    const r = reviewActionBodySchema.safeParse({
      actionType: "override_score",
      notes: "adjust",
    });
    expect(r.success).toBe(false);
  });

  it("accepts override_score with score", () => {
    const r = reviewActionBodySchema.safeParse({
      actionType: "override_score",
      newOverallScore: 88,
    });
    expect(r.success).toBe(true);
  });

  it("requires signal id for dismiss_signal", () => {
    const r = reviewActionBodySchema.safeParse({
      actionType: "dismiss_signal",
      payload: {},
    });
    expect(r.success).toBe(false);
  });
});
