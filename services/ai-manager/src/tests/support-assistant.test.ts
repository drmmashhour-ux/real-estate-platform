import { describe, it, expect } from "vitest";
import { runSupportAssistant } from "../services/support-assistant.service.js";

describe("support-assistant", () => {
  it("answers cancellation question", () => {
    const out = runSupportAssistant({
      action: "answer_question",
      question: "How do I cancel my booking?",
    });
    expect(out.answer).toBeDefined();
    expect(out.answer?.toLowerCase()).toContain("cancel");
  });

  it("suggests reply for refund", () => {
    const out = runSupportAssistant({
      action: "suggest_reply",
      messages: [{ role: "user", content: "I want a refund" }],
    });
    expect(out.suggestedReply).toBeDefined();
  });
});
