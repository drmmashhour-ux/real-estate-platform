import { describe, expect, it } from "vitest";

import {
  buildEarlyUserSignalsFromCount,
  earlyUserHeroSubline,
  earlyUserOnboardingHeadline,
} from "@/lib/growth/earlyUserSignalsLogic";

describe("buildEarlyUserSignalsFromCount (Order 45 — real count only)", () => {
  it("count 0 → first-cohort copy", () => {
    const s = buildEarlyUserSignalsFromCount(0);
    expect(s).toMatchObject({ count: 0, remaining: 100, isEarlyPhase: true });
    expect(s.message).toBe("Be among the first 100 users");
  });

  it("count 80 → scarcity copy with 20 remaining", () => {
    const s = buildEarlyUserSignalsFromCount(80);
    expect(s).toMatchObject({ count: 80, remaining: 20, isEarlyPhase: true });
    expect(s.message).toBe("Only 20 spots left for early access");
  });

  it("count 100 → community, not FOMO phase", () => {
    const s = buildEarlyUserSignalsFromCount(100);
    expect(s.isEarlyPhase).toBe(false);
    expect(s.message).toBe("You're part of our early community");
  });

  it("count 100+ → no urgency message string", () => {
    const s = buildEarlyUserSignalsFromCount(101);
    expect(s.isEarlyPhase).toBe(false);
    expect(s.message).toBe("");
  });
});

describe("earlyUserOnboardingHeadline", () => {
  it("hides when no early phase (100+ or closed cohort)", () => {
    const closed = buildEarlyUserSignalsFromCount(101);
    expect(earlyUserOnboardingHeadline(closed)).toBe("");

    const atCap = buildEarlyUserSignalsFromCount(100);
    expect(earlyUserOnboardingHeadline(atCap)).toBe("");
  });
});

describe("earlyUserHeroSubline", () => {
  it("hides for post-early cohort or empty message", () => {
    expect(earlyUserHeroSubline(buildEarlyUserSignalsFromCount(101))).toBeNull();
    expect(earlyUserHeroSubline(buildEarlyUserSignalsFromCount(100))).toBeNull();
  });

  it("shows during early phase", () => {
    const s = buildEarlyUserSignalsFromCount(42);
    expect(earlyUserHeroSubline(s)).toBe("Join 42/100 early users");
  });
});
