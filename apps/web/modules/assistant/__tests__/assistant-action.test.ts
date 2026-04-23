import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    deal: { findFirst: vi.fn(), findUnique: vi.fn() },
    lecipmVisit: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/leads/timeline-helpers", () => ({
  appendLeadTimelineEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/provider", () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/modules/ai-sales-agent/ai-sales-message.service", () => ({
  buildAiSalesFollowUpValue: vi.fn().mockReturnValue({ subject: "S", html: "<p>x</p>" }),
}));

vi.mock("@/modules/no-show-prevention/no-show-reschedule.service", () => ({
  rescheduleLecipmVisit: vi.fn().mockResolvedValue({ ok: true, visitId: "v2" }),
}));

import { prisma } from "@/lib/db";
import { executeAssistantAction } from "../assistant-action.service";

describe("executeAssistantAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LECIPM_BROKER_ASSISTANT_MODE = "SAFE_AUTOPILOT";
  });

  it("requires confirmation flag", async () => {
    vi.mocked(prisma.lead.findFirst).mockResolvedValue({ id: "l1" });
    vi.mocked(prisma.lead.findUnique).mockResolvedValue({
      email: "a@b.c",
      name: "A",
      optedOutOfFollowUp: false,
      listing: { title: "T" },
      fsboListing: null,
    });
    const r = await executeAssistantAction({
      brokerUserId: "b1",
      brokerRole: "BROKER",
      actionType: "SEND_FOLLOWUP",
      actionPayload: { leadId: "l1" },
      confirmed: false,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.code).toBe("CONFIRM");
  });

  it("rejects forbidden lead", async () => {
    vi.mocked(prisma.lead.findFirst).mockResolvedValue(null);
    const r = await executeAssistantAction({
      brokerUserId: "b1",
      brokerRole: "BROKER",
      actionType: "SEND_FOLLOWUP",
      actionPayload: { leadId: "l1" },
      confirmed: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.code).toBe("FORBIDDEN");
  });
});
