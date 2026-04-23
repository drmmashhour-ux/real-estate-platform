import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    leadTimelineEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));
import {
  buildAiSalesFirstResponsePlain,
  LECIPM_ASSISTANT_DISCLOSURE,
} from "../ai-sales-message.service";
import { shouldEscalateToBroker } from "../ai-sales-escalation.service";
import { proposeBusinessHourSlots } from "../ai-sales-booking.service";

describe("AI Sales Agent", () => {
  it("discloses assistant identity in first response", () => {
    const r = buildAiSalesFirstResponsePlain({
      leadId: "l1",
      listingTitle: "123 Main",
      trigger: "centris_capture",
      mode: "SAFE_AUTOPILOT",
    });
    expect(r.html).toContain("LECIPM assistant");
    expect(r.text).toContain(LECIPM_ASSISTANT_DISCLOSURE.slice(0, 40));
  });

  it("escalates HOT and visit intents", () => {
    expect(
      shouldEscalateToBroker({
        qualification: {
          tier: "HOT",
          reasons: [],
          summary: "",
          intent: "buy",
        },
        visitRequested: false,
        complexQuestion: false,
      }),
    ).toBe("tier_hot");

    expect(
      shouldEscalateToBroker({
        qualification: {
          tier: "WARM",
          reasons: [],
          summary: "",
          intent: "unknown",
        },
        visitRequested: true,
        complexQuestion: false,
      }),
    ).toBe("visit_requested");

    expect(
      shouldEscalateToBroker({
        qualification: {
          tier: "COLD",
          reasons: [],
          summary: "",
          intent: "unknown",
        },
        visitRequested: false,
        complexQuestion: true,
      }),
    ).toBe("complex_question");
  });

  it("proposes a bounded number of slots", () => {
    const s = proposeBusinessHourSlots("ET", 4);
    expect(s.length).toBeLessThanOrEqual(4);
    expect(s.every((x) => x.includes("·"))).toBe(true);
  });
});
