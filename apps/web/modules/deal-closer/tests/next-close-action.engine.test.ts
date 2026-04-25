import { describe, expect, it } from "vitest";
import { recommendNextCloseActions } from "../next-close-action.engine";
import type { CloseBlocker, DealCloserContext, ClosingReadinessResult } from "../deal-closer.types";

const readiness = (label: ClosingReadinessResult["label"]): ClosingReadinessResult => ({
  score: 50,
  label,
  rationale: [],
});

describe("recommendNextCloseActions", () => {
  it("avoids leading with offer when premature push is high and readiness not extreme", () => {
    const blockers: CloseBlocker[] = [
      { key: "unresolved_price_objection", label: "Price", severity: "high", rationale: [] },
    ];
    const actions = recommendNextCloseActions({} as DealCloserContext, readiness("close_ready"), blockers, "high");
    const top = actions[0];
    expect(top).toBeDefined();
    expect(top!.key).not.toBe("propose_offer_discussion");
  });

  it("suggests visit when not scheduled and readiness high", () => {
    const a = recommendNextCloseActions(
      { visitScheduled: false } as DealCloserContext,
      readiness("high_intent"),
      [],
      "low"
    );
    expect(a.some((x) => x.key === "schedule_visit")).toBe(true);
  });
});
