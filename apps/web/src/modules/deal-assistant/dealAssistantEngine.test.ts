import { describe, expect, it } from "vitest";
import { analyzeConversation } from "./dealAssistantEngine";

describe("dealAssistantEngine", () => {
  it("detects browsing + wait for low-engagement thread", () => {
    const r = analyzeConversation([
      { senderType: "user", messageText: "Just browsing for now", createdAt: new Date(Date.now() - 86400000 * 3) },
    ]);
    expect(r.detectedIntent).toBe("browsing");
    expect(r.detectedObjection).toBe("none");
    expect(r.urgencyLevel).toBe("low");
    expect(r.recommendedAction).toBe("wait");
    expect(r.messageSuggestion.length).toBeGreaterThan(20);
  });

  it("detects price objection and send_message", () => {
    const r = analyzeConversation([
      { senderType: "user", messageText: "Love the place but it's over my budget", createdAt: new Date() },
    ]);
    expect(r.detectedObjection).toBe("price");
    expect(r.recommendedAction).toBe("send_message");
    expect(r.messageSuggestion.toLowerCase()).toMatch(/price|budget|value/);
  });

  it("detects hesitation and reassurance copy", () => {
    const r = analyzeConversation([
      { senderType: "user", messageText: "Not sure yet — need to think about it", createdAt: new Date() },
    ]);
    expect(r.detectedObjection).toBe("hesitation");
    expect(r.messageSuggestion.toLowerCase()).toMatch(/sure|pressure|confident/);
  });

  it("detects trust → assign_broker", () => {
    const r = analyzeConversation([
      { senderType: "user", messageText: "Is this listing legit? Worried about scams", createdAt: new Date() },
    ]);
    expect(r.detectedObjection).toBe("trust");
    expect(r.recommendedAction).toBe("assign_broker");
  });

  it("detects ready_to_buy + push_booking", () => {
    const r = analyzeConversation([
      { senderType: "user", messageText: "We are ready to book a showing this week", createdAt: new Date() },
    ]);
    expect(r.detectedIntent).toBe("ready_to_buy");
    expect(r.recommendedAction).toBe("push_booking");
    expect(r.urgencyLevel).toBe("high");
    expect(r.messageSuggestion.toLowerCase()).toMatch(/time|visit|call|week/);
  });

  it("returns bounded confidence", () => {
    const r = analyzeConversation([{ senderType: "user", messageText: "hello" }]);
    expect(r.confidence).toBeGreaterThanOrEqual(0.35);
    expect(r.confidence).toBeLessThanOrEqual(0.95);
  });

  it("applies bounded marketplace memory hints without replacing message signals", () => {
    const base = analyzeConversation([
      { senderType: "user", messageText: "Just browsing for now", createdAt: new Date(Date.now() - 86400000 * 3) },
    ]);
    expect(base.urgencyLevel).toBe("low");
    const bumped = analyzeConversation(
      [
        {
          senderType: "user",
          messageText: "Just browsing for now",
          createdAt: new Date(Date.now() - 86400000 * 3),
        },
      ],
      { marketplaceMemoryHints: { urgencyScore: 70, activeVsPassive: "active" } },
    );
    expect(bumped.urgencyLevel).toBe("medium");
  });
});
