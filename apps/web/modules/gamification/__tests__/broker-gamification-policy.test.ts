import { describe, expect, it } from "vitest";
import {
  complianceQualityScore,
  leaderboardEligible,
  cumulativePointsToLevel,
} from "@/modules/gamification/broker-gamification-policy";

describe("broker gamification policy", () => {
  it("scores verified brokers higher than none", () => {
    const v = complianceQualityScore({ brokerStatus: "VERIFIED", verificationStatus: null });
    const n = complianceQualityScore({ brokerStatus: "NONE", verificationStatus: null });
    expect(v).toBeGreaterThan(n);
  });

  it("blocks leaderboard visibility when compliance is critically low", () => {
    expect(leaderboardEligible(0.2, 900)).toBe(false);
    expect(leaderboardEligible(0.5, 900)).toBe(true);
  });

  it("caps platinum without compliance floor", () => {
    expect(cumulativePointsToLevel(2500, 0.45)).not.toBe("PLATINUM");
  });
});
