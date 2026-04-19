import { describe, expect, it } from "vitest";
import { buildFollowUpSuggestions } from "@/modules/broker/closing/broker-followup.service";
import { computeResponseSpeedScore } from "@/modules/broker/closing/broker-response.service";
import {
  deriveLeadClosingStageFromRow,
  shouldSkipMarkContacted,
  shouldSkipMarkResponded,
} from "@/modules/broker/closing/broker-closing-state.service";
import { mergeBrokerClosingIntoAiExplanation, parseBrokerClosingV1 } from "@/modules/broker/closing/broker-closing-persist";
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

describe("broker closing V1", () => {
  it("deriveLeadClosingStageFromRow prefers persisted brokerClosingV1", () => {
    const aiExplanation = {
      brokerClosingV1: {
        version: 1,
        stage: "negotiation",
        responseReceived: true,
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-02T00:00:00.000Z",
      },
    };
    expect(
      deriveLeadClosingStageFromRow({
        aiExplanation,
        pipelineStage: "new",
        pipelineStatus: "new",
        wonAt: null,
        lostAt: null,
      }),
    ).toBe("negotiation");
  });

  it("mergeBrokerClosingIntoAiExplanation is additive", () => {
    const merged = mergeBrokerClosingIntoAiExplanation({ other: true }, { stage: "contacted", responseReceived: false });
    expect((merged as { other: boolean }).other).toBe(true);
    expect(parseBrokerClosingV1(merged)?.stage).toBe("contacted");
  });

  it("buildFollowUpSuggestions returns first_contact for new stage", () => {
    const s = buildFollowUpSuggestions({
      state: state({ stage: "new" }),
      nowMs: Date.now(),
    });
    expect(s.length).toBeGreaterThan(0);
    expect(s[0]?.type).toBe("first_contact");
    expect(s.length).toBeLessThanOrEqual(3);
  });

  it("computeResponseSpeedScore uses unlock to first contact when both present", () => {
    const unlock = "2025-01-01T12:00:00.000Z";
    const first = "2025-01-01T14:00:00.000Z";
    const r = computeResponseSpeedScore({
      state: state({ stage: "contacted", lastContactAt: first }),
      contactUnlockedAt: unlock,
      firstContactAt: first,
      nowMs: Date.parse("2025-01-02T12:00:00.000Z"),
    });
    expect(r).toBe("fast");
  });

  it("computeResponseSpeedScore defaults to average without signals", () => {
    expect(
      computeResponseSpeedScore({
        state: state({ stage: "new" }),
        nowMs: Date.now(),
      }),
    ).toBe("average");
  });

  it("shouldSkipMarkContacted avoids duplicate moves when already past contacted", () => {
    expect(shouldSkipMarkContacted(state({ stage: "new" }))).toBe(false);
    expect(shouldSkipMarkContacted(state({ stage: "contacted" }))).toBe(true);
    expect(shouldSkipMarkContacted(state({ stage: "responded" }))).toBe(true);
  });

  it("shouldSkipMarkResponded avoids duplicate when already at responded+", () => {
    expect(shouldSkipMarkResponded(state({ stage: "contacted" }))).toBe(false);
    expect(shouldSkipMarkResponded(state({ stage: "responded" }))).toBe(true);
    expect(shouldSkipMarkResponded(state({ stage: "meeting_scheduled" }))).toBe(true);
  });
});
