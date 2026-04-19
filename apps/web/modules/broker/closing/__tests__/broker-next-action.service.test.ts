import { describe, expect, it } from "vitest";

import {
  computeDailyStripCounts,
  computeIdleHours,
  computeNextBestAction,
  computeTopThreeToClose,
  meetingsMarkedFromStage,
} from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingState } from "@/modules/broker/closing/broker-closing.types";

function state(partial: Partial<LeadClosingState> & Pick<LeadClosingState, "stage">): LeadClosingState {
  const now = new Date().toISOString();
  return {
    leadId: "l1",
    brokerId: "b1",
    responseReceived: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

describe("broker next-action service", () => {
  it("computeNextBestAction prefers first outreach for new leads", () => {
    const n = computeNextBestAction({ state: state({ stage: "new" }), nowMs: Date.now() });
    expect(n.actionType).toBe("first_outreach");
    expect(n.urgency).toBe("high");
    expect(n.followUpDraftHint).toBe("first_contact");
  });

  it("computeNextBestAction returns terminal message for closed leads", () => {
    const n = computeNextBestAction({ state: state({ stage: "closed_won" }), nowMs: Date.now() });
    expect(n.actionType).toBe("review_terminal");
    expect(n.followUpDraftHint).toBeNull();
  });

  it("computeTopThreeToClose is deterministic (urgency, score, leadId)", () => {
    const now = Date.now();
    const mk = (leadId: string, score: number) => {
      const closing = state({ stage: "new", leadId });
      return {
        leadId,
        name: leadId,
        score,
        closing,
        nextAction: computeNextBestAction({ state: closing, nowMs: now }),
      };
    };
    const rows = [mk("z", 10), mk("y", 30), mk("x", 20)];
    const top = computeTopThreeToClose(rows);
    expect(top.map((x) => x.leadId)).toEqual(["y", "x", "z"]);
  });

  it("computeDailyStripCounts aggregates advisory buckets", () => {
    const now = Date.now();
    const rows = [
      {
        closing: state({ stage: "new" }),
        nextAction: computeNextBestAction({ state: state({ stage: "new" }), nowMs: now }),
        score: 80,
      },
      {
        closing: state({
          stage: "contacted",
          lastContactAt: new Date(now - 60 * 3600000).toISOString(),
          responseReceived: false,
        }),
        nextAction: computeNextBestAction({
          state: state({
            stage: "contacted",
            lastContactAt: new Date(now - 60 * 3600000).toISOString(),
          }),
          nowMs: now,
        }),
        score: 40,
      },
    ];
    const d = computeDailyStripCounts(rows, now);
    expect(d.needsActionToday).toBeGreaterThanOrEqual(1);
    expect(d.overdueFollowUps).toBeGreaterThanOrEqual(1);
  });

  it("computeIdleHours uses lastContactAt when present", () => {
    const t0 = Date.now() - 25 * 3600000;
    const h = computeIdleHours(
      state({ stage: "contacted", lastContactAt: new Date(t0).toISOString() }),
      Date.now(),
    );
    expect(h).not.toBeNull();
    expect(h!).toBeGreaterThan(20);
  });

  it("meeting_scheduled with long idle suggests confirm or reschedule before global archive", () => {
    const nowMs = Date.parse("2026-04-10T12:00:00.000Z");
    const lastMs = nowMs - 121 * 60 * 60 * 1000;
    const closing = state({
      stage: "meeting_scheduled",
      lastContactAt: new Date(lastMs).toISOString(),
    });
    const n = computeNextBestAction({ state: closing, nowMs });
    expect(n.actionLabel.toLowerCase()).toContain("confirm");
  });

  it("negotiation stage uses deal-focused label", () => {
    const n = computeNextBestAction({
      state: state({ stage: "negotiation", lastContactAt: new Date().toISOString() }),
      nowMs: Date.now(),
    });
    expect(n.actionLabel.toLowerCase()).toContain("terms");
  });

  it("meetingsMarkedFromStage reflects meeting-or-later work", () => {
    expect(meetingsMarkedFromStage("new")).toBe(false);
    expect(meetingsMarkedFromStage("meeting_scheduled")).toBe(true);
    expect(meetingsMarkedFromStage("closed_won")).toBe(true);
  });

  it("responded with very long idle still prioritizes push meeting over archive", () => {
    const nowMs = Date.parse("2026-05-01T12:00:00.000Z");
    const lastMs = nowMs - 400 * 60 * 60 * 1000;
    const n = computeNextBestAction({
      state: state({ stage: "responded", lastContactAt: new Date(lastMs).toISOString() }),
      nowMs,
    });
    expect(n.actionType).toBe("push_meeting");
  });
});
