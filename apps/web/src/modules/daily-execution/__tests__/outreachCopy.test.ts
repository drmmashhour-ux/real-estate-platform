import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOLLOW_UP_MESSAGE,
  DEFAULT_REPLY_TO_CALL_MESSAGE,
  generateBetterHook,
  generateFollowUpMessage,
  generateReplyResponse,
} from "../domain/outreachCopy";

describe("outreachCopy", () => {
  it("generateFollowUpMessage default", () => {
    expect(generateFollowUpMessage()).toBe(DEFAULT_FOLLOW_UP_MESSAGE);
    expect(generateFollowUpMessage("  x  ")).toBe("x");
  });

  it("generateReplyResponse default", () => {
    expect(generateReplyResponse()).toBe(DEFAULT_REPLY_TO_CALL_MESSAGE);
  });

  it("generateBetterHook returns three hooks per angle", () => {
    const m = generateBetterHook("mistake");
    expect(m.hooks).toHaveLength(3);
    expect(m.angle).toBe("mistake");
  });
});
