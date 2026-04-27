import { describe, expect, it } from "vitest";

import { buildAcquisitionInsightsFromUserRows } from "@/lib/growth/acquisitionInsightsRollup";

function ch(source: string) {
  return { channel: source };
}

describe("buildAcquisitionInsightsFromUserRows (Order 50.1)", () => {
  it("empty users → safe defaults", () => {
    const r = buildAcquisitionInsightsFromUserRows([], new Set());
    expect(r.totalUsers).toBe(0);
    expect(r.topChannel).toBeNull();
    expect(r.channels).toEqual([]);
    expect(r.attributedUsers).toBe(0);
  });

  it("one user per row — duplicate user ids would double-count (caller must send one row per user)", () => {
    const r = buildAcquisitionInsightsFromUserRows(
      [
        { id: "a", signupAttributionJson: ch("tiktok"), launchOnboardingCompletedAt: null },
        { id: "b", signupAttributionJson: ch("tiktok"), launchOnboardingCompletedAt: null },
      ],
      new Set()
    );
    expect(r.totalUsers).toBe(2);
    expect(r.topChannel).toBe("tiktok");
    const tik = r.channels.find((c) => c.source === "tiktok");
    expect(tik?.users).toBe(2);
  });

  it("topChannel is highest user count", () => {
    const r = buildAcquisitionInsightsFromUserRows(
      [
        { id: "1", signupAttributionJson: ch("meta"), launchOnboardingCompletedAt: null },
        { id: "2", signupAttributionJson: ch("meta"), launchOnboardingCompletedAt: null },
        { id: "3", signupAttributionJson: ch("google"), launchOnboardingCompletedAt: null },
      ],
      new Set()
    );
    expect(r.topChannel).toBe("meta");
    expect(r.channels[0]!.source).toBe("meta");
  });

  it("channel percentages sum to ~100% of total signups (non-visitor set)", () => {
    const r = buildAcquisitionInsightsFromUserRows(
      [
        { id: "1", signupAttributionJson: ch("tiktok"), launchOnboardingCompletedAt: null },
        { id: "2", signupAttributionJson: ch("google"), launchOnboardingCompletedAt: null },
        { id: "3", signupAttributionJson: ch("google"), launchOnboardingCompletedAt: null },
        { id: "4", signupAttributionJson: ch("other"), launchOnboardingCompletedAt: null },
      ],
      new Set()
    );
    const sum = r.channels.reduce((acc, c) => acc + c.percentage, 0);
    expect(Math.abs(sum - 100) < 0.01).toBe(true);
  });

  it("null JSON → other bucket, not attributed to named channel", () => {
    const r = buildAcquisitionInsightsFromUserRows(
      [{ id: "x", signupAttributionJson: null, launchOnboardingCompletedAt: null }],
      new Set()
    );
    expect(r.channels.some((c) => c.source === "other" && c.users === 1)).toBe(true);
    expect(r.attributedUsers).toBe(0);
  });
});
