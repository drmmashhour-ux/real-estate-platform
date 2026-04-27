import { describe, expect, it } from "vitest";

import { generateSocialProof } from "../socialProof";

describe("generateSocialProof (Order 47)", () => {
  it("bookings > 10 increases score and includes booking line", () => {
    const s = generateSocialProof({ bookings: 15, views: 0, rating: 0 });
    expect(s.score).toBeGreaterThanOrEqual(0.4);
    expect(s.messages.some((m) => m.includes("15"))).toBe(true);
    expect(s.messages.some((m) => m.includes("Booked"))).toBe(true);
  });

  it("all strong signals → high strength", () => {
    const s = generateSocialProof({ bookings: 20, views: 200, rating: 4.9 });
    expect(s.strength).toBe("high");
    expect(s.score).toBe(1);
    expect(s.messages).toContain("Popular listing");
  });

  it("no data → empty messages, score 0, low", () => {
    const s = generateSocialProof({ bookings: 0, views: 0, rating: 0 });
    expect(s.messages).toEqual([]);
    expect(s.score).toBe(0);
    expect(s.strength).toBe("low");
  });
});
