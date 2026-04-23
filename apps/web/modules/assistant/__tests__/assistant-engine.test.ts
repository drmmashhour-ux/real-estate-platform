import { describe, expect, it } from "vitest";
import { buildAssistantSuggestions } from "../assistant.engine";

describe("buildAssistantSuggestions", () => {
  it("adds stable ids and follow-up action when lead context present", () => {
    const out = buildAssistantSuggestions(
      {
        deal: null,
        lead: {
          id: "L1",
          status: "x",
          pipelineStatus: "new",
          score: 50,
          updatedAt: new Date(),
          daysSinceTouch: 1.5,
          highIntent: false,
        },
        hoursSinceLastBrokerAction: 10,
        staleLeadCount: 0,
        contextLeadId: "L1",
        contextDealId: null,
      },
      8,
    );
    const follow = out.find((s) => s.message.includes("Follow up within 24h"));
    expect(follow?.id).toBeDefined();
    expect(follow?.actionType).toBe("SEND_FOLLOWUP");
    expect(follow?.actionPayload).toEqual({ leadId: "L1" });
  });
});
