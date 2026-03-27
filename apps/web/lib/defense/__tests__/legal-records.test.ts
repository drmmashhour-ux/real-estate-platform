/**
 * Tests for legal records – policy acceptance, hasAcceptedPolicy, legal event log.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordPolicyAcceptance, hasAcceptedPolicy } from "@/lib/defense/legal-records";

vi.mock("@/lib/db", () => ({
  prisma: {
    policyAcceptanceRecord: { create: vi.fn(), count: vi.fn() },
    legalEventLog: { create: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Legal records", () => {
  beforeEach(() => {
    vi.mocked(prisma.policyAcceptanceRecord.create).mockReset();
    vi.mocked(prisma.policyAcceptanceRecord.count).mockReset();
    vi.mocked(prisma.legalEventLog.create).mockResolvedValue({} as never);
  });

  describe("recordPolicyAcceptance", () => {
    it("creates acceptance record and legal event", async () => {
      vi.mocked(prisma.policyAcceptanceRecord.create).mockResolvedValue({
        id: "1",
        userId: "u1",
        policyKey: "booking_terms",
        policyVersion: "2024-01",
        acceptedAt: new Date(),
        marketId: null,
        entityType: "BOOKING",
        entityId: "b1",
        ipAddress: null,
        userAgent: null,
        metadata: null,
      });
      const record = await recordPolicyAcceptance({
        userId: "u1",
        policyKey: "booking_terms",
        policyVersion: "2024-01",
        entityType: "BOOKING",
        entityId: "b1",
      });
      expect(record.policyKey).toBe("booking_terms");
      expect(record.entityId).toBe("b1");
      expect(prisma.legalEventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "TERMS_ACCEPTED",
            userId: "u1",
            entityType: "BOOKING",
            entityId: "b1",
          }),
        })
      );
    });
  });

  describe("hasAcceptedPolicy", () => {
    it("returns true when count > 0", async () => {
      vi.mocked(prisma.policyAcceptanceRecord.count).mockResolvedValue(1);
      const result = await hasAcceptedPolicy("u1", "booking_terms");
      expect(result).toBe(true);
    });

    it("returns false when count is 0", async () => {
      vi.mocked(prisma.policyAcceptanceRecord.count).mockResolvedValue(0);
      const result = await hasAcceptedPolicy("u1", "booking_terms");
      expect(result).toBe(false);
    });
  });
});
