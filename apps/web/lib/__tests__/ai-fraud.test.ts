/**
 * Tests for fraud detection AI – score computation, priority, storage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeFraudScore, getFraudScore } from "@/lib/ai-fraud";

vi.mock("@/lib/db", () => ({
  prisma: {
    fraudSignal: { findMany: vi.fn() },
    fraudScore: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    aiModel: { findUnique: vi.fn() },
    aiDecisionLog: { create: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("AI Fraud", () => {
  beforeEach(() => {
    vi.mocked(prisma.fraudSignal.findMany).mockReset();
    vi.mocked(prisma.fraudScore.findFirst).mockReset();
  });

  describe("computeFraudScore", () => {
    it("returns score 0 and LOW when no signals", async () => {
      vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([]);
      const r = await computeFraudScore({ entityType: "USER", entityId: "u1" });
      expect(r.score).toBe(0);
      expect(r.priority).toBe("LOW");
      expect(r.factors).toEqual({});
    });

    it("returns HIGH priority when score >= 0.7", async () => {
      vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([
        { id: "s1", entityType: "USER", entityId: "u1", signalType: "PAYMENT_FRAUD", score: 0.8, metadata: null, createdAt: new Date() },
      ] as never[]);
      const r = await computeFraudScore({ entityType: "USER", entityId: "u1" });
      expect(r.score).toBeGreaterThanOrEqual(0.7);
      expect(r.priority).toBe("HIGH");
    });

    it("returns MEDIUM priority when score in [0.4, 0.7)", async () => {
      vi.mocked(prisma.fraudSignal.findMany).mockResolvedValue([
        { id: "s1", entityType: "USER", entityId: "u1", signalType: "SUSPICIOUS_BOOKING", score: 0.5, metadata: null, createdAt: new Date() },
      ] as never[]);
      const r = await computeFraudScore({ entityType: "USER", entityId: "u1" });
      expect(r.priority).toBe("MEDIUM");
    });
  });

  describe("getFraudScore", () => {
    it("returns null when no stored score", async () => {
      vi.mocked(prisma.fraudScore.findFirst).mockResolvedValue(null);
      const s = await getFraudScore("USER", "u1");
      expect(s).toBeNull();
    });
  });
});
