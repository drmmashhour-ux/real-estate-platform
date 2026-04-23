import { describe, it, expect, vi, beforeEach } from "vitest";
import { isBrokerInsuranceValid } from "../insurance.service";
import { evaluateBrokerInsuranceRisk } from "../insurance-risk.engine";
import { computeBrokerTrustScore } from "../trust-score.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    brokerInsurance: {
      findFirst: vi.fn(),
    },
    realEstateTransaction: { count: vi.fn() },
    reputationComplaint: { count: vi.fn() },
    brokerTransactionRecord: { count: vi.fn() },
    fsboListing: { count: vi.fn() },
    insuranceClaim: { count: vi.fn() },
    brokerComplianceEvent: { findFirst: vi.fn(), count: vi.fn() },
  },
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
    it("should increase risk score when claims exist", async () => {
      (prisma.insuranceClaim.count as any).mockResolvedValue(1);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);

      const result = await evaluateBrokerInsuranceRisk({ brokerId: "b1" });
      // Base is 20, 1 claim adds 20
      expect(result.riskScore).toBe(40);
      expect(result.flags).toContain("recent_claim_penalty: at least one claim in the last year.");
    });

    it("should highly penalize multiple claims", async () => {
      (prisma.insuranceClaim.count as any).mockResolvedValue(3);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);

      const result = await evaluateBrokerInsuranceRisk({ brokerId: "b1" });
      // Base 20 + 45 = 65
      expect(result.riskScore).toBe(65);
    });
  });

  describe("Trust Score Computation", () => {
    it("should compute a blended trust score", async () => {
      // Mock active insurance
      (prisma.brokerInsurance.findFirst as any).mockResolvedValue({
        status: "ACTIVE",
        coveragePerLoss: 2000000,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });
      // Mock low risk
      (prisma.insuranceClaim.count as any).mockResolvedValue(0);
      (prisma.realEstateTransaction.count as any).mockResolvedValue(0);
      (prisma.reputationComplaint.count as any).mockResolvedValue(0);
      (prisma.brokerTransactionRecord.count as any).mockResolvedValue(0);
      (prisma.fsboListing.count as any).mockResolvedValue(0);
      // Mock high compliance
      (prisma.brokerComplianceEvent.count as any).mockResolvedValue(0);

      const result = await computeBrokerTrustScore("b1");
      // Insurance (1.0 * 0.4) + Compliance (1.0 * 0.3) + Risk (0.8 * 0.3) = 0.4 + 0.3 + 0.24 = 0.94
      // Note: Base risk score is 20, so risk01 is 1 - 0.2 = 0.8
      expect(result.trustScore).toBeGreaterThan(0.9);
      expect(result.insuranceValid).toBe(true);
    });
  });
});
