/**
 * Unit tests for revenue intelligence – record and aggregate.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordRevenueEntry, getRevenueSummary } from "@/lib/revenue-intelligence";

vi.mock("@/lib/db", () => ({
  prisma: {
    revenueLedgerEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Revenue intelligence", () => {
  beforeEach(() => {
    vi.mocked(prisma.revenueLedgerEntry.create).mockReset();
    vi.mocked(prisma.revenueLedgerEntry.findMany).mockReset();
  });

  describe("recordRevenueEntry", () => {
    it("creates entry with required fields", async () => {
      const entry = {
        id: "1",
        type: "BOOKING_COMMISSION",
        entityType: "BOOKING",
        entityId: "B1",
        amountCents: 1500,
        marketId: null,
        module: "BNHUB",
        userId: null,
        metadata: null,
        createdAt: new Date(),
      };
      vi.mocked(prisma.revenueLedgerEntry.create).mockResolvedValue(entry);
      const result = await recordRevenueEntry({
        type: "BOOKING_COMMISSION",
        entityType: "BOOKING",
        entityId: "B1",
        amountCents: 1500,
        module: "BNHUB",
      });
      expect(result.amountCents).toBe(1500);
      expect(result.type).toBe("BOOKING_COMMISSION");
    });
  });

  describe("getRevenueSummary", () => {
    it("aggregates by type", async () => {
      vi.mocked(prisma.revenueLedgerEntry.findMany).mockResolvedValue([
        { type: "BOOKING_COMMISSION", amountCents: 100 } as never,
        { type: "BOOKING_COMMISSION", amountCents: 200 } as never,
        { type: "SUBSCRIPTION", amountCents: 500 } as never,
      ]);
      const summary = await getRevenueSummary({
        periodStart: new Date("2025-01-01"),
        periodEnd: new Date("2025-01-31"),
      });
      expect(summary.byType.BOOKING_COMMISSION).toBe(300);
      expect(summary.byType.SUBSCRIPTION).toBe(500);
      expect(summary.totalCents).toBe(800);
    });
  });
});
