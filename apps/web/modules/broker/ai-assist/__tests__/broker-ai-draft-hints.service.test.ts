import { describe, expect, it } from "vitest";

import { mapSuggestionToDraftHint } from "@/modules/broker/ai-assist/broker-ai-draft-hints.service";

describe("broker-ai-draft-hints.service", () => {
  it("maps next action hints deterministically", () => {
    const r = mapSuggestionToDraftHint({
      actionType: "first_outreach",
      actionLabel: "x",
      urgency: "high",
      reason: "y",
      followUpDraftHint: "first_contact",
    });
    expect(r.hint).toBe("first_contact");
    expect(r.plainAngle.length).toBeGreaterThan(10);
  });
});
