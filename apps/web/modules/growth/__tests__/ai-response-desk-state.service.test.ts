import { describe, expect, it } from "vitest";
import {
  mergeReviewStateIntoAiExplanation,
  parsePersistedReviewState,
} from "../ai-response-desk-state.service";

describe("parsePersistedReviewState", () => {
  it("returns null for invalid explanation", () => {
    expect(parsePersistedReviewState(null)).toBeNull();
    expect(parsePersistedReviewState([])).toBeNull();
  });

  it("reads reviewState from aiMessagingAssist", () => {
    expect(
      parsePersistedReviewState({
        aiMessagingAssist: { reviewState: "reviewed" },
      }),
    ).toBe("reviewed");
  });
});

describe("mergeReviewStateIntoAiExplanation", () => {
  it("merges without touching message field", () => {
    const prev = {
      other: 1,
      aiMessagingAssist: {
        version: "v1" as const,
        suggestedReply: "Hi",
        tone: "professional" as const,
        rationale: "r",
        generatedAt: "t",
      },
    };
    const merged = mergeReviewStateIntoAiExplanation(prev, "done");
    expect(merged).not.toBeNull();
    const o = merged as Record<string, unknown>;
    expect(o.other).toBe(1);
    const am = o.aiMessagingAssist as Record<string, unknown>;
    expect(am.suggestedReply).toBe("Hi");
    expect(am.reviewState).toBe("done");
    expect(typeof am.reviewUpdatedAt).toBe("string");
  });

  it("returns null when aiMessagingAssist missing", () => {
    expect(mergeReviewStateIntoAiExplanation({ foo: 1 }, "reviewed")).toBeNull();
  });
});
