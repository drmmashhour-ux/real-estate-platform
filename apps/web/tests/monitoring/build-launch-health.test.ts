import { describe, expect, it } from "vitest";
import { buildLaunchHealth } from "@/lib/monitoring/build-launch-health";

describe("buildLaunchHealth", () => {
  it("returns score between 0 and 100", () => {
    const h = buildLaunchHealth({
      bookings: {
        createdInRange: 10,
        byStatus: {},
        awaitingHostApproval: 2,
        pendingManualSettlement: 1,
        cancelledInRange: 0,
        onlineStripeCheckoutPayments: 5,
        manualTrackedBookings: 1,
        attentionBookings: [],
      },
      payments: {
        paymentsCreated: 8,
        byStatus: { COMPLETED: 7, FAILED: 1 },
        withCheckoutSession: 7,
        failed: 1,
        completed: 7,
        webhookEvents: 6,
        webhookByType: {},
        recentFailed: [],
      },
      errors: { totalInRange: 3, byType: {}, recent: [] },
      ai: {
        recommendationsCreated: 4,
        recommendationsByStatus: {},
        approvalPending: 2,
        approvalApproved: 1,
        approvalRejected: 0,
      },
      notifications: { notificationsCreated: 12, byType: {} },
    });
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
    expect(h.subsystems.length).toBeGreaterThan(4);
  });

  it("adds critical alert on high payment failure ratio", () => {
    const h = buildLaunchHealth({
      bookings: {
        createdInRange: 50,
        byStatus: {},
        awaitingHostApproval: 1,
        pendingManualSettlement: 0,
        cancelledInRange: 0,
        onlineStripeCheckoutPayments: 40,
        manualTrackedBookings: 0,
        attentionBookings: [],
      },
      payments: {
        paymentsCreated: 20,
        byStatus: {},
        withCheckoutSession: 20,
        failed: 5,
        completed: 15,
        webhookEvents: 10,
        webhookByType: {},
        recentFailed: [],
      },
      errors: { totalInRange: 0, byType: {}, recent: [] },
      ai: {
        recommendationsCreated: 0,
        recommendationsByStatus: {},
        approvalPending: 0,
        approvalApproved: 0,
        approvalRejected: 0,
      },
      notifications: { notificationsCreated: 0, byType: {} },
    });
    expect(h.alerts.some((a) => a.id === "stripe-fail-rate")).toBe(true);
  });
});
