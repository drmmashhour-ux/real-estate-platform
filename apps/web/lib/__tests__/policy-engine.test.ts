/**
 * Unit tests for policy engine: rule evaluation and policy helpers.
 * Mocks Prisma to avoid DB in CI.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  evaluateRule,
  evaluatePolicies,
  canConfirmBooking,
  canLeaveReview,
  canReleasePayout,
} from "@/lib/policy-engine";

vi.mock("@/lib/db", () => ({
  prisma: {
    policyRule: { findUnique: vi.fn() },
    policyDecisionLog: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Policy engine", () => {
  beforeEach(() => {
    vi.mocked(prisma.policyRule.findUnique).mockReset();
    vi.mocked(prisma.policyDecisionLog.create).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ accountStatus: "ACTIVE" } as never);
  });

  describe("evaluateRule", () => {
    it("returns allowed when rule does not exist (no rule)", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue(null);
      const r = await evaluateRule("unknown_rule", {
        entityType: "BOOKING",
        entityId: "B1",
      });
      expect(r.allowed).toBe(true);
      expect(r.effect).toBe("ALLOW");
    });

    it("denies when maxFraudScore exceeded", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "booking_confirm_fraud",
        name: "Fraud block",
        ruleType: "AUTO_BLOCK",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { maxFraudScore: 0.8 },
        effect: "DENY",
        effectPayload: { reasonCode: "FRAUD_BLOCK" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await evaluateRule("booking_confirm_fraud", {
        entityType: "BOOKING",
        entityId: "B1",
        fraudScore: 0.9,
      });
      expect(r.allowed).toBe(false);
      expect(r.effect).toBe("DENY");
      expect(r.reasonCode).toBe("FRAUD_BLOCK");
    });

    it("allows when fraudScore below maxFraudScore", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "booking_confirm_fraud",
        name: "Fraud block",
        ruleType: "AUTO_BLOCK",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { maxFraudScore: 0.8 },
        effect: "DENY",
        effectPayload: { reasonCode: "FRAUD_BLOCK" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await evaluateRule("booking_confirm_fraud", {
        entityType: "BOOKING",
        entityId: "B1",
        fraudScore: 0.5,
      });
      expect(r.allowed).toBe(true);
      expect(r.effect).toBe("ALLOW");
    });

    it("denies when requireCompletedStay and bookingStatus is not COMPLETED", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "review_eligibility_completed_stay",
        name: "Completed stay only",
        ruleType: "REVIEW_ELIGIBILITY",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { requireCompletedStay: true },
        effect: "DENY",
        effectPayload: { reasonCode: "STAY_NOT_COMPLETED" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await evaluateRule("review_eligibility_completed_stay", {
        entityType: "REVIEW",
        entityId: "B1",
        bookingStatus: "PENDING",
      });
      expect(r.allowed).toBe(false);
      expect(r.reasonCode).toBe("STAY_NOT_COMPLETED");
    });

    it("allows when requireCompletedStay and bookingStatus is COMPLETED", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "review_eligibility_completed_stay",
        name: "Completed stay only",
        ruleType: "REVIEW_ELIGIBILITY",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { requireCompletedStay: true },
        effect: "DENY",
        effectPayload: { reasonCode: "STAY_NOT_COMPLETED" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await evaluateRule("review_eligibility_completed_stay", {
        entityType: "REVIEW",
        entityId: "B1",
        bookingStatus: "COMPLETED",
      });
      expect(r.allowed).toBe(true);
    });

    it("hold when minVerification not met (payout_release_identity)", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "payout_release_identity",
        name: "Identity verified",
        ruleType: "VERIFICATION",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { minVerification: "VERIFIED" },
        effect: "HOLD",
        effectPayload: { reasonCode: "VERIFY_IDENTITY", holdReason: "Complete identity verification." },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await evaluateRule("payout_release_identity", {
        entityType: "PAYOUT",
        entityId: "P1",
        verificationStatus: "PENDING",
      });
      expect(r.allowed).toBe(false);
      expect(r.effect).toBe("HOLD");
      expect(r.holdReason).toContain("identity");
    });
  });

  describe("evaluatePolicies", () => {
    it("returns first DENY when multiple rules and first fails", async () => {
      vi.mocked(prisma.policyRule.findUnique)
        .mockResolvedValueOnce({
          id: "1",
          key: "payout_release_identity",
          name: "Identity",
          ruleType: "VERIFICATION",
          scope: "GLOBAL",
          scopeValue: null,
          conditions: { minVerification: "VERIFIED" },
          effect: "HOLD",
          effectPayload: { reasonCode: "VERIFY_IDENTITY", holdReason: "Verify." },
          version: 1,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const r = await evaluatePolicies(
        ["payout_release_identity", "payout_release_fraud"],
        { entityType: "PAYOUT", entityId: "P1", verificationStatus: "PENDING" }
      );
      expect(r.allowed).toBe(false);
      expect(r.ruleKey).toBe("payout_release_identity");
    });
  });

  describe("canConfirmBooking", () => {
    it("uses booking_confirm_fraud rule", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "booking_confirm_fraud",
        name: "Fraud",
        ruleType: "AUTO_BLOCK",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { maxFraudScore: 0.8 },
        effect: "DENY",
        effectPayload: { reasonCode: "FRAUD_BLOCK" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await canConfirmBooking({
        bookingId: "B1",
        listingId: "L1",
        fraudScore: 0.9,
      });
      expect(r.allowed).toBe(false);
    });
  });

  describe("canLeaveReview", () => {
    it("denies when stay not completed", async () => {
      vi.mocked(prisma.policyRule.findUnique).mockResolvedValue({
        id: "1",
        key: "review_eligibility_completed_stay",
        name: "Completed stay",
        ruleType: "REVIEW_ELIGIBILITY",
        scope: "GLOBAL",
        scopeValue: null,
        conditions: { requireCompletedStay: true },
        effect: "DENY",
        effectPayload: { reasonCode: "STAY_NOT_COMPLETED" },
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const r = await canLeaveReview({ bookingId: "B1", bookingStatus: "PENDING" });
      expect(r.allowed).toBe(false);
    });
  });

  describe("canReleasePayout", () => {
    it("holds when verification is PENDING", async () => {
      vi.mocked(prisma.policyRule.findUnique)
        .mockResolvedValueOnce({
          id: "1",
          key: "payout_release_identity",
          name: "Identity",
          ruleType: "VERIFICATION",
          scope: "GLOBAL",
          scopeValue: null,
          conditions: { minVerification: "VERIFIED" },
          effect: "HOLD",
          effectPayload: { reasonCode: "VERIFY_IDENTITY", holdReason: "Verify." },
          version: 1,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const r = await canReleasePayout({
        userId: "U1",
        bookingId: "B1",
        verificationStatus: "PENDING",
      });
      expect(r.allowed).toBe(false);
      expect(r.effect).toBe("HOLD");
    });
  });
});
