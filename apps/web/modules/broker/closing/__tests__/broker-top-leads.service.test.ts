import { describe, expect, it } from "vitest";

import {
  computeNextBestAction,
  computeTopThreeToClose,
} from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingState } from "@/modules/broker/closing/broker-closing.types";
import {
  buildLeadHighlightSets,
  deriveMomentum,
  pickTopThreeToClose,
  rankLeadsForConversionConsole,
} from "@/modules/broker/closing/broker-top-leads.service";

function state(partial: Partial<LeadClosingState> & Pick<LeadClosingState, "stage" | "leadId">): LeadClosingState {
  const now = new Date().toISOString();
  return {
    brokerId: "b1",
    responseReceived: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

describe("broker-top-leads service", () => {
  const nowMs = Date.UTC(2026, 3, 2, 12, 0, 0);

  it("pickTopThreeToClose matches computeTopThreeToClose", () => {
    const mk = (leadId: string, score: number, stage: LeadClosingState["stage"] = "new") => {
      const closing = state({ leadId, stage });
      return {
        leadId,
        name: leadId,
        score,
        closing,
        nextAction: computeNextBestAction({ state: closing, nowMs }),
      };
    };
    const rows = [mk("a", 10), mk("b", 50), mk("c", 40)];
    expect(pickTopThreeToClose(rows)).toEqual(computeTopThreeToClose(rows));
  });

  it("rankLeadsForConversionConsole is deterministic and excludes terminal leads", () => {
    const mk = (leadId: string, score: number, stage: LeadClosingState["stage"]) => {
      const closing = state({ leadId, stage });
      return {
        leadId,
        name: leadId,
        score,
        closing,
        nextAction: computeNextBestAction({ state: closing, nowMs }),
      };
    };
    const rows = [
      mk("won", 99, "closed_won"),
      mk("z", 10, "new"),
      mk("y", 30, "new"),
      mk("x", 20, "new"),
    ];
    const ranked = rankLeadsForConversionConsole(rows, nowMs);
    expect(ranked.map((r) => r.leadId)).toEqual(["y", "x", "z"]);
    expect(ranked.every((r) => r.conversionScore >= 0)).toBe(true);
  });

  it("deriveMomentum flags new / high urgency as needs_action_now", () => {
    const closing = state({ leadId: "l1", stage: "new" });
    const next = computeNextBestAction({ state: closing, nowMs });
    expect(deriveMomentum(closing, next, null, 50)).toBe("needs_action_now");
  });

  it("deriveMomentum flags long idle as cooling_down when next action is not forced high-priority", () => {
    const closing = state({
      leadId: "l1",
      stage: "meeting_scheduled",
      lastContactAt: new Date(nowMs - 100 * 3600000).toISOString(),
    });
    const next = computeNextBestAction({ state: closing, nowMs });
    expect(next.urgency).toBe("medium");
    expect(deriveMomentum(closing, next, 100, 50)).toBe("cooling_down");
  });

  it("deriveMomentum flags hot pipeline score at advanced stages", () => {
    const closing = state({ leadId: "l1", stage: "responded", responseReceived: true });
    const next = computeNextBestAction({ state: closing, nowMs });
    expect(deriveMomentum(closing, next, 10, 75)).toBe("hot_lead");
    expect(deriveMomentum(closing, next, 10, 40)).not.toBe("hot_lead");
  });

  it("buildLeadHighlightSets marks top three and urgent high-urgency leads", () => {
    const mk = (leadId: string, score: number) => {
      const closing = state({ leadId, stage: "new" });
      return {
        leadId,
        name: leadId,
        score,
        closing,
        nextAction: computeNextBestAction({ state: closing, nowMs }),
      };
    };
    const rows = [mk("a", 50), mk("b", 40)];
    const ranked = rankLeadsForConversionConsole(
      rows.map((r) => ({
        leadId: r.leadId,
        name: r.name,
        score: r.score,
        closing: r.closing,
        nextAction: r.nextAction,
      })),
      nowMs,
    );
    const top = computeTopThreeToClose(rows);
    const sets = buildLeadHighlightSets(ranked, top, nowMs);
    expect(sets.topThreeIds.has("a")).toBe(true);
    expect(sets.urgentIds.size).toBeGreaterThanOrEqual(1);
  });
});
