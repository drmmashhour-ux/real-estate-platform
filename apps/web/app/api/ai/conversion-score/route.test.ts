import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/ai/conversionEngine", () => ({
  getConversionScore: vi.fn().mockResolvedValue({
    listingId: "L1",
    userId: "u1",
    score: 0.5,
    intentLevel: "medium",
    reasons: ["search_events"],
    canUseHighAttentionCopy: true,
  }),
  getConversionNudge: vi.fn().mockReturnValue({
    title: "Good match for your search",
    message: "x",
    intentLevel: "medium",
    displayLevel: "medium",
  }),
  emptyConversionScore: vi.fn().mockReturnValue({
    listingId: "L0",
    userId: undefined,
    score: 0.05,
    intentLevel: "low",
    reasons: [],
    canUseHighAttentionCopy: false,
  }),
}));

vi.mock("@/lib/flags", () => ({
  flags: { RECOMMENDATIONS: true, AI_PRICING: false, AUTONOMOUS_AGENT: false },
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn().mockResolvedValue("u1"),
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({ logError: vi.fn() }));

import { getConversionScore } from "@/lib/ai/conversionEngine";

describe("POST /api/ai/conversion-score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns score and nudge when session matches", async () => {
    const res = await POST(
      new Request("http://localhost/api/ai/conversion-score", {
        method: "POST",
        body: JSON.stringify({ listingId: "L1", userId: "u1" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { score: { intentLevel: string } };
    expect(data.score.intentLevel).toBe("medium");
    expect(vi.mocked(getConversionScore)).toHaveBeenCalled();
  });
});
