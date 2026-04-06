import { describe, expect, it } from "vitest";
import {
  FRAUD_NO_AUTO_ENFORCEMENT,
  FRAUD_SCORE_THRESHOLDS,
  planFraudSafeActions,
  scoreShortTermListingFraud,
} from "../fraud-engine";
import type { ShortTermListingFraudRawSignals } from "../fraud-signals";
import { FRAUD_AUTOPILOT_SUPPRESSION_LEVELS } from "../fraud-types";

function baseRaw(over: Partial<ShortTermListingFraudRawSignals> = {}): ShortTermListingFraudRawSignals {
  return {
    listingId: "l1",
    hostUserId: "h1",
    titleLen: 80,
    descLen: 400,
    photoCount: 8,
    duplicateTitleOtherOwners: 0,
    openBnhubFraudFlags: 0,
    openBnhubSafetyFlags: 0,
    failedVerificationLogs90d: 0,
    listingUpdatedAfterOpenFraudFlag: false,
    hostManagerOverrides90d: 0,
    hostTrustSafetyIncidents90d: 0,
    duplicatePhoneOtherUsers: 0,
    failedPaymentsOnListing: 0,
    maxGuestRepeatBookings90dSameListing: 0,
    cancelledBookings90dOnListing: 0,
    reviewsOnListingLast7d: 0,
    duplicateReviewCommentBodiesOnListing: false,
    ...over,
  };
}

describe("scoreShortTermListingFraud", () => {
  it("flags suspicious incomplete listing (sparse + few photos + open flag crosses medium)", () => {
    const a = scoreShortTermListingFraud(
      baseRaw({ titleLen: 4, descLen: 10, photoCount: 1, openBnhubFraudFlags: 1 }),
    );
    expect(a.riskScore).toBeGreaterThanOrEqual(FRAUD_SCORE_THRESHOLDS.mediumMin);
    expect(["MEDIUM", "HIGH"]).toContain(a.riskLevel);
    expect(a.reasons.some((r) => r.includes("sparse"))).toBe(true);
  });

  it("increases risk when failed payment and repeat guest patterns stack", () => {
    const low = scoreShortTermListingFraud(baseRaw());
    const withFailures = scoreShortTermListingFraud(
      baseRaw({
        failedPaymentsOnListing: 3,
        maxGuestRepeatBookings90dSameListing: 5,
      }),
    );
    expect(withFailures.riskScore).toBeGreaterThan(low.riskScore);
    expect(withFailures.reasons.some((r) => r.includes("failed_payments"))).toBe(true);
    expect(withFailures.reasons.some((r) => r.includes("repeat_guest"))).toBe(true);
  });

  it("HIGH when duplicate title and duplicate phone both present", () => {
    const a = scoreShortTermListingFraud(
      baseRaw({
        duplicateTitleOtherOwners: 1,
        duplicatePhoneOtherUsers: 1,
        openBnhubFraudFlags: 2,
      }),
    );
    expect(a.riskLevel).toBe("HIGH");
    expect(a.riskScore).toBeGreaterThanOrEqual(FRAUD_SCORE_THRESHOLDS.highMin);
  });
});

describe("planFraudSafeActions", () => {
  it("emits admin alert for medium and high", () => {
    expect(planFraudSafeActions("LOW").emitAdminHealthEvent).toBe(false);
    expect(planFraudSafeActions("MEDIUM").emitAdminHealthEvent).toBe(true);
    expect(planFraudSafeActions("HIGH").emitAdminHealthEvent).toBe(true);
  });

  it("creates override-required only for high", () => {
    expect(planFraudSafeActions("MEDIUM").emitOverrideRequired).toBe(false);
    expect(planFraudSafeActions("HIGH").emitOverrideRequired).toBe(true);
  });

  it("reduces autopilot aggressiveness for medium/high only", () => {
    expect(planFraudSafeActions("LOW").reduceAutopilotAggression).toBe(false);
    expect(planFraudSafeActions("MEDIUM").reduceAutopilotAggression).toBe(true);
    expect(planFraudSafeActions("HIGH").reduceAutopilotAggression).toBe(true);
  });
});

describe("safety invariants", () => {
  it("never implies auto-ban or auto-removal (module flag)", () => {
    expect(FRAUD_NO_AUTO_ENFORCEMENT).toBe(true);
  });

  it("autopilot suppression only for medium/high", () => {
    expect(FRAUD_AUTOPILOT_SUPPRESSION_LEVELS).toEqual(["MEDIUM", "HIGH"]);
  });
});
