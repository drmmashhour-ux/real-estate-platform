import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiMessagingAssistInput } from "../ai-autopilot-messaging.types";
import { resetMessagingAssistMonitoringForTests, getMessagingAssistMonitoringSnapshot } from "../ai-autopilot-messaging-monitoring.service";

const messagingFlags = vi.hoisted(() => ({
  messagingAssistV1: true,
  messagingTemplatesV1: true,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    aiAutopilotMessagingAssistFlags: messagingFlags,
  };
});

import { buildLeadReplyDraft } from "../ai-autopilot-messaging-assist.service";
import { buildReplyDraftsForLeads } from "../ai-autopilot-messaging-bulk.service";

function baseInput(over: Partial<AiMessagingAssistInput> = {}): AiMessagingAssistInput {
  return {
    leadId: "lead-1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+15550001",
    message: "I am interested in the downtown property and would like more information about the listing.",
    listingId: null,
    listingCode: "LEC-100",
    aiScore: 78,
    aiPriority: "high",
    aiTags: ["high_intent"],
    createdAt: new Date("2026-01-15T12:00:00.000Z"),
    ...over,
  };
}

const FORBIDDEN = /guarantee|guaranteed|100\s*%\s*(success|results)|sms|whatsapp|email\s+sent/i;

beforeEach(() => {
  messagingFlags.messagingAssistV1 = true;
  messagingFlags.messagingTemplatesV1 = true;
  resetMessagingAssistMonitoringForTests();
});

describe("buildLeadReplyDraft", () => {
  it("generates a draft for high-priority lead with rationale", () => {
    const d = buildLeadReplyDraft(baseInput());
    expect(d).not.toBeNull();
    expect(d!.leadId).toBe("lead-1");
    expect(d!.suggestedReply.length).toBeGreaterThan(10);
    expect(d!.rationale.length).toBeGreaterThan(5);
    expect(d!.tone).toMatch(/friendly|professional|short/);
    expect(FORBIDDEN.test(d!.suggestedReply)).toBe(false);
  });

  it("uses short tone for low-info signals when templates are on", () => {
    const d = buildLeadReplyDraft(
      baseInput({
        aiPriority: "low",
        aiTags: ["low_info"],
        message: "hi",
      }),
    );
    expect(d).not.toBeNull();
    expect(d!.tone).toBe("short");
  });

  it("does not promise guaranteed outcomes in the suggested reply", () => {
    const d = buildLeadReplyDraft(baseInput({ aiPriority: "medium", aiTags: [] }));
    expect(d).not.toBeNull();
    expect(FORBIDDEN.test(d!.suggestedReply)).toBe(false);
  });

  it("does not mutate the source lead/message object", () => {
    const row = {
      leadId: "x",
      name: "A",
      email: "a@b.com",
      phone: "1",
      message: "original",
      createdAt: new Date(),
    } as AiMessagingAssistInput;
    const copy = { ...row };
    buildLeadReplyDraft(row);
    expect(row.message).toBe(copy.message);
  });

  it("returns null when messaging assist flag is off", () => {
    messagingFlags.messagingAssistV1 = false;
    expect(buildLeadReplyDraft(baseInput())).toBeNull();
  });

  it("uses professional tone when templates flag is off", () => {
    messagingFlags.messagingTemplatesV1 = false;
    const d = buildLeadReplyDraft(baseInput({ aiTags: ["low_info"], message: "x" }));
    expect(d).not.toBeNull();
    expect(d!.tone).toBe("professional");
  });
});

describe("buildReplyDraftsForLeads", () => {
  it("returns stable drafts for multiple leads and updates monitoring counts", () => {
    const a = baseInput({ leadId: "a" });
    const b = baseInput({ leadId: "b", aiPriority: "low", aiTags: ["low_info"], message: "?" });
    const out = buildReplyDraftsForLeads([a, b]);
    expect(out).toHaveLength(2);
    expect(out[0]!.leadId).toBe("a");
    expect(out[1]!.leadId).toBe("b");
    const snap = getMessagingAssistMonitoringSnapshot();
    expect(snap.draftsGenerated).toBeGreaterThanOrEqual(2);
  });
});

describe("safety", () => {
  it("draft service has no outbound transport imports", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(dir, "../ai-autopilot-messaging-assist.service.ts"), "utf8");
    expect(/nodemailer|twilio|sendgrid|resend|whatsapp/i.test(src)).toBe(false);
  });
});
