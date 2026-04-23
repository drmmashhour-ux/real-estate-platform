import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerInsuranceAlerts } from "../insurance-alert.service";
import { isBrokerInsuranceValid } from "../insurance.service";
import { evaluateBrokerInsuranceRisk } from "../insurance-risk.engine";
import { computeBrokerTrustScore } from "../trust-score.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    brokerInsurance: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    realEstateTransaction: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    reputationComplaint: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    brokerTransactionRecord: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    fsboListing: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    insuranceClaim: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    brokerComplianceEvent: {
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/modules/notifications/services/create-notification", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

describe("Insurance Trust Intelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Strict Coverage Validation", () => {
    it("should return false if insurance is expired", async () => {
      (prisma.brokerInsurance.findFirst as any).mockResolvedValue(null);
      const result = await isBrokerInsuranceValid("b1");
      expect(result).toBe(false);
    });

    it("should return true if insurance is active and coverage is sufficient", async () => {
      (prisma.brokerInsurance.findFirst as any).mockResolvedValue({
        id: "i1",
        status: "ACTIVE",
        coveragePerLoss: 2000000,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });
      const result = await isBrokerInsuranceValid("b1");
      expect(result).toBe(true);
    });
  });

  describe("Claim Impact on Risk Engine", () => {
    const oldClaim = { status: "SUBMITTED", createdAt: new Date(Date.now() - 120 * 86400000) };

    it("should increase risk score when claims exist (last 12 months)", async () => {
      (prisma.insuranceClaim.findMany as any).mockResolvedValue([oldClaim]);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);

      const result = await evaluateBrokerInsuranceRisk({ brokerId: "b1" });
      expect(result.riskScore).toBe(41);
      expect(result.flags.some((f) => f.includes("claim in the last year"))).toBe(true);
    });

    it("should highly penalize multiple claims", async () => {
      (prisma.insuranceClaim.findMany as any).mockResolvedValue([oldClaim, oldClaim, oldClaim]);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);

      const result = await evaluateBrokerInsuranceRisk({ brokerId: "b1" });
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.flags.some((f) => f.includes("high_claim_frequency"))).toBe(true);
    });

    it("should add recent-window penalty for claims in the last 30 days", async () => {
      const recent = { status: "SUBMITTED", createdAt: new Date(Date.now() - 5 * 86400000) };
      (prisma.insuranceClaim.findMany as any).mockResolvedValue([recent]);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);

      const result = await evaluateBrokerInsuranceRisk({ brokerId: "b1" });
      expect(result.riskScore).toBeGreaterThan(40);
      expect(result.flags.some((f) => f.includes("last 30 days"))).toBe(true);
    });
  });

  describe("Trust Score Computation", () => {
    it("should compute a blended trust score", async () => {
      (prisma.brokerInsurance.findFirst as any).mockResolvedValue({
        status: "ACTIVE",
        coveragePerLoss: 2000000,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });
      (prisma.insuranceClaim.findMany as any).mockResolvedValue([]);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);
      (prisma.brokerComplianceEvent.count as any).mockResolvedValue(0);

      const result = await computeBrokerTrustScore("b1");
      expect(result.trustScore).toBeGreaterThan(0.9);
      expect(result.insuranceValid).toBe(true);
    });
  });

  describe("Alert triggers", () => {
    it("fires notifications for expiry trigger (broker + admin)", async () => {
      const { createNotification } = await import("@/modules/notifications/services/create-notification");
      (prisma.user.findUnique as any).mockResolvedValue({ id: "b1", name: "Test", email: "t@t.com" });
      (prisma.user.findMany as any).mockResolvedValue([{ id: "adm1" }]);

      await triggerInsuranceAlerts("b1", "EXPIRY", { expiryDate: new Date().toISOString() });

      expect(createNotification).toHaveBeenCalled();
      expect((createNotification as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
