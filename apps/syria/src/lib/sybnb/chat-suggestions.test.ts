import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  collectRuleSuggestions,
  genericFallbackSuggestions,
  getReplySuggestions,
} from "@/lib/sybnb/chat-suggestions";

describe("collectRuleSuggestions", () => {
  it("maps keywords to fixed English copy", () => {
    expect(collectRuleSuggestions("What is the price per night?", "en")).toContain(
      "The price is as listed. Let me know if you have questions.",
    );
    expect(collectRuleSuggestions("Are you available next week?", "en")).toContain(
      "Yes, the dates are available. I can confirm your booking.",
    );
    expect(collectRuleSuggestions("How does payment work?", "en")).toContain(
      "We will arrange payment after approval.",
    );
  });

  it("matches case-insensitively", () => {
    expect(collectRuleSuggestions("PRICE question", "en").length).toBeGreaterThan(0);
  });

  it("returns multiple rules when multiple keywords match", () => {
    const s = collectRuleSuggestions("price and payment please", "en");
    expect(s.length).toBe(2);
  });
});

describe("getReplySuggestions (rules-only path)", () => {
  beforeEach(() => {
    vi.stubEnv("SYBNB_CHAT_SUGGESTIONS_AI_ENABLED", "false");
  });
  it("returns generic fallbacks when AI disabled and no keyword match", async () => {
    const snapshot = {
      status: "requested",
      checkInIso: "2026-05-01",
      checkOutIso: "2026-05-03",
      nights: 2,
      guests: 2,
    };
    const r = await getReplySuggestions({
      lastGuestMessage: "hello there",
      booking: snapshot,
      locale: "en",
    });
    expect(r.suggestions).toEqual(genericFallbackSuggestions("en"));
    expect(r.source).toBe("rules");
  });
});
