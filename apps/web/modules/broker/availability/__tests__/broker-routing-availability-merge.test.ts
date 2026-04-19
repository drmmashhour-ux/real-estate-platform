import { describe, expect, it, beforeEach } from "vitest";
import { mergeBrokerRoutingAvailabilitySummary } from "../broker-routing-availability-merge.service";
import { resetBrokerAvailabilityMonitoringForTests } from "../broker-availability-monitoring.service";

beforeEach(() => {
  resetBrokerAvailabilityMonitoringForTests();
});

describe("broker-routing-availability-merge", () => {
  it("boosts available + healthy capacity mildly", () => {
    const m = mergeBrokerRoutingAvailabilitySummary({
      brokerId: "b1",
      flags: { availability: true, capacity: true, sla: true },
      availability: {
        brokerId: "b1",
        status: "available",
        explanation: "accepting",
      },
      capacity: {
        brokerId: "b1",
        activeLeads: 2,
        overdueFollowUps: 0,
        recentAssignments: 0,
        capacityScore: 80,
        status: "available",
        explanation: "ok",
      },
      sla: {
        brokerId: "b1",
        slaHealth: "good",
        explanation: "ok",
      },
    });
    expect(m?.routingAdjustment).toBeGreaterThan(0);
    expect(m?.reasons.join(" ")).toMatch(/Accepting|pipeline|discipline/i);
  });

  it("penalizes unavailable accepting flag off path", () => {
    const m = mergeBrokerRoutingAvailabilitySummary({
      brokerId: "b2",
      flags: { availability: true, capacity: false, sla: false },
      availability: {
        brokerId: "b2",
        status: "unavailable",
        explanation: "paused",
      },
      capacity: null,
      sla: null,
    });
    expect(m?.routingAdjustment ?? 0).toBeLessThan(0);
  });

  it("returns null when all flags off", () => {
    expect(
      mergeBrokerRoutingAvailabilitySummary({
        brokerId: "b3",
        flags: { availability: false, capacity: false, sla: false },
        availability: null,
        capacity: null,
        sla: null,
      }),
    ).toBeNull();
  });

  it("keeps adjustment bounded", () => {
    const m = mergeBrokerRoutingAvailabilitySummary({
      brokerId: "b4",
      flags: { availability: true, capacity: true, sla: true },
      availability: {
        brokerId: "b4",
        status: "unavailable",
        explanation: "x",
      },
      capacity: {
        brokerId: "b4",
        activeLeads: 99,
        overdueFollowUps: 12,
        recentAssignments: 10,
        capacityScore: 18,
        status: "unavailable",
        explanation: "overload",
      },
      sla: {
        brokerId: "b4",
        slaHealth: "poor",
        explanation: "strain",
      },
    });
    expect(m?.routingAdjustment ?? 0).toBeGreaterThanOrEqual(-22);
    expect(m?.routingAdjustment ?? 0).toBeLessThanOrEqual(14);
  });
});
