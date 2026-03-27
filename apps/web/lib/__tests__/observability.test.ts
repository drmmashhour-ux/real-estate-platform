/**
 * Unit tests for observability: platform health snapshot and events.
 * Mocks Prisma to avoid DB in CI.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlatformHealthSnapshot, createSystemAlert, getActiveAlerts } from "@/lib/observability";

vi.mock("@/lib/db", () => ({
  prisma: {
    platformEvent: { create: vi.fn(), findMany: vi.fn() },
    serviceHealthMetric: { create: vi.fn(), findMany: vi.fn() },
    systemAlert: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    operationalIncident: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    booking: { count: vi.fn() },
    payment: { count: vi.fn() },
    dispute: { count: vi.fn() },
    fraudSignal: { count: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Observability", () => {
  beforeEach(() => {
    vi.mocked(prisma.booking.count).mockReset();
    vi.mocked(prisma.payment.count).mockReset();
    vi.mocked(prisma.dispute.count).mockReset();
    vi.mocked(prisma.fraudSignal.count).mockReset();
    vi.mocked(prisma.systemAlert.create).mockReset();
    vi.mocked(prisma.systemAlert.findMany).mockReset();
  });

  describe("getPlatformHealthSnapshot", () => {
    it("aggregates counts over the last 24h", async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(10);
      vi.mocked(prisma.payment.count)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      vi.mocked(prisma.dispute.count).mockResolvedValue(1);
      vi.mocked(prisma.fraudSignal.count).mockResolvedValue(0);

      const snapshot = await getPlatformHealthSnapshot();

      expect(snapshot.bookingsCreated).toBe(10);
      expect(snapshot.paymentsCompleted).toBe(8);
      expect(snapshot.paymentsFailed).toBe(2);
      expect(snapshot.disputesCreated).toBe(1);
      expect(snapshot.fraudSignalsCreated).toBe(0);
      expect(snapshot.paymentFailureRate).toBe(2 / (8 + 2)); // 0.2
    });

    it("returns zero failure rate when no payments", async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.payment.count).mockResolvedValue(0);
      vi.mocked(prisma.dispute.count).mockResolvedValue(0);
      vi.mocked(prisma.fraudSignal.count).mockResolvedValue(0);

      const snapshot = await getPlatformHealthSnapshot();

      expect(snapshot.paymentFailureRate).toBe(0);
    });
  });

  describe("createSystemAlert and getActiveAlerts", () => {
    it("createSystemAlert creates and getActiveAlerts returns unresolved", async () => {
      const alert = {
        id: "alert-1",
        alertType: "PAYMENT_FAILURE_RATE",
        severity: "WARNING",
        message: "High failure rate",
        threshold: 0.1,
        currentValue: 0.25,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.systemAlert.create).mockResolvedValue(alert);
      vi.mocked(prisma.systemAlert.findMany).mockResolvedValue([alert]);

      await createSystemAlert({
        alertType: "PAYMENT_FAILURE_RATE",
        severity: "WARNING",
        message: "High failure rate",
        threshold: 0.1,
        currentValue: 0.25,
      });

      const active = await getActiveAlerts();
      expect(active).toHaveLength(1);
      expect(active[0].message).toBe("High failure rate");
      expect(active[0].resolvedAt).toBeNull();
    });
  });
});
