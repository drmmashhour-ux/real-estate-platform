import { describe, expect, it } from "vitest";
import { buildAutonomousActionCandidates } from "@/modules/autonomy/action-candidate-builder.service";

describe("action-candidate-builder.service", () => {
  it("builds prioritize_deal from portfolio stalled hint", () => {
    const c = buildAutonomousActionCandidates({
      portfolioHints: [{ dealId: "d1", stalled: true, priority: 80 }],
    });
    expect(c.some((x) => x.actionType === "PRIORITIZE_DEAL")).toBe(true);
  });

  it("never throws on garbage input", () => {
    const c = buildAutonomousActionCandidates({
      portfolioHints: [null as unknown as Record<string, unknown>],
    });
    expect(Array.isArray(c)).toBe(true);
  });
});
