import { describe, expect, it } from "vitest";
import { recommendedActionsForLead, tierEmoji, tierFromScore } from "./lead-tier";

describe("tierFromScore", () => {
  it("maps 80+ to hot", () => {
    expect(tierFromScore(80)).toBe("hot");
    expect(tierFromScore(100)).toBe("hot");
  });
  it("maps 50–79 to warm", () => {
    expect(tierFromScore(50)).toBe("warm");
    expect(tierFromScore(79)).toBe("warm");
  });
  it("maps under 50 to cold", () => {
    expect(tierFromScore(0)).toBe("cold");
    expect(tierFromScore(49)).toBe("cold");
  });
});

describe("tierEmoji", () => {
  it("returns expected emojis", () => {
    expect(tierEmoji("hot")).toBe("🔥");
    expect(tierEmoji("warm")).toBe("🌡️");
    expect(tierEmoji("cold")).toBe("❄️");
  });
});

describe("recommendedActionsForLead", () => {
  it("suggests urgent follow-up for hot leads", () => {
    const a = recommendedActionsForLead({
      tier: "hot",
      daysSinceCreated: 0,
      lastFollowUpAt: null,
    });
    expect(a.some((x) => x.includes("24h"))).toBe(true);
    expect(a.some((x) => x.includes("similar"))).toBe(true);
  });
});
