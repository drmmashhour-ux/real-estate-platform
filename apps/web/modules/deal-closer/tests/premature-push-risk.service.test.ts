import { describe, expect, it } from "vitest";
import { computePrematurePushRisk } from "../premature-push-risk.service";
import type { CloseBlocker, DealCloserContext, ClosingReadinessResult } from "../deal-closer.types";

const r = (l: ClosingReadinessResult["label"]): ClosingReadinessResult => ({ score: 40, label: l, rationale: [] });

describe("computePrematurePushRisk", () => {
  it("returns high for silence + objections", () => {
    const blockers: CloseBlocker[] = [
      { key: "long_silence", label: "Silence", severity: "high", rationale: [] },
      { key: "unresolved_price_objection", label: "Price", severity: "high", rationale: [] },
    ];
    const p = computePrematurePushRisk(
      { silenceGapDays: 8, financingReadiness: "weak", engagementScore: 30 } as DealCloserContext,
      r("not_ready"),
      blockers
    );
    expect(p).toBe("high");
  });

  it("returns low for healthy context", () => {
    const p = computePrematurePushRisk(
      { visitScheduled: true, offerDiscussed: true, engagementScore: 70, silenceGapDays: 0, financingReadiness: "strong" } as DealCloserContext,
      r("high_intent"),
      []
    );
    expect(p).toBe("low");
  });
});
