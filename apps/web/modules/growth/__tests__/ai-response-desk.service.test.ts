import { describe, expect, it } from "vitest";
import type { AiFollowUpQueueItem } from "../ai-autopilot-followup.types";
import type { AiMessagingAssistResult } from "../ai-autopilot-messaging.types";
import {
  buildResponseDeskItems,
  shouldIncludeLeadOnDesk,
  sortResponseDeskItems,
} from "../ai-response-desk.service";
import type { AiResponseDeskItem, AiResponseDeskLeadRow } from "../ai-response-desk.types";

function lead(id: string, over: Partial<AiResponseDeskLeadRow> = {}): AiResponseDeskLeadRow {
  return {
    id,
    name: "N",
    email: "e@test",
    message: "hello world here",
    aiPriority: "medium",
    aiTags: [],
    aiExplanation: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...over,
  };
}

function draft(leadId: string): AiMessagingAssistResult {
  return {
    leadId,
    suggestedReply: "Hi",
    tone: "professional",
    rationale: "r",
    confidence: 0.7,
    createdAt: "2026-01-02T00:00:00.000Z",
  };
}

function fq(leadId: string, status: AiFollowUpQueueItem["status"]): AiFollowUpQueueItem {
  return {
    leadId,
    name: "N",
    email: "e@test",
    aiPriority: "medium",
    status,
    followUpPriority: "medium",
    queueScore: 50,
    rationale: "x",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("buildResponseDeskItems", () => {
  it("orders high-priority leads before lower when both have drafts", () => {
    const hi = lead("a", { aiPriority: "high" });
    const lo = lead("b", { aiPriority: "low" });
    const items = buildResponseDeskItems({
      leads: [lo, hi],
      draftsByLeadId: new Map([
        ["a", draft("a")],
        ["b", draft("b")],
      ]),
      followByLeadId: new Map(),
    });
    expect(items[0]!.leadId).toBe("a");
    expect(items[1]!.leadId).toBe("b");
  });

  it("excludes leads with no draft, no open follow-up, no review", () => {
    const items = buildResponseDeskItems({
      leads: [lead("only")],
      draftsByLeadId: new Map(),
      followByLeadId: new Map(),
    });
    expect(items.length).toBe(0);
  });

  it("includes follow-up due_now without draft", () => {
    const items = buildResponseDeskItems({
      leads: [lead("x")],
      draftsByLeadId: new Map(),
      followByLeadId: new Map([["x", fq("x", "due_now")]]),
    });
    expect(items.length).toBe(1);
    expect(items[0]!.draftStatus).toBe("followup_recommended");
  });
});

describe("shouldIncludeLeadOnDesk", () => {
  it("returns false when nothing actionable", () => {
    expect(
      shouldIncludeLeadOnDesk({
        aiExplanation: null,
        draft: undefined,
        follow: undefined,
      }),
    ).toBe(false);
  });
});

describe("sortResponseDeskItems", () => {
  it("is stable by leadId for same tier", () => {
    const items: AiResponseDeskItem[] = [
      {
        leadId: "z",
        leadName: "a",
        leadEmail: "a",
        draftStatus: "needs_review",
        sortTier: 1,
      },
      {
        leadId: "a",
        leadName: "b",
        leadEmail: "b",
        draftStatus: "needs_review",
        sortTier: 1,
      },
    ];
    const s = sortResponseDeskItems(items);
    expect(s[0]!.leadId).toBe("a");
    expect(s[1]!.leadId).toBe("z");
  });
});
