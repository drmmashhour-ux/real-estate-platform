import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logInfo = vi.fn();

vi.mock("@/lib/logger", () => ({
  logInfo: (...args: unknown[]) => logInfo(...args),
}));

describe("revenue-events.service", () => {
  beforeEach(async () => {
    vi.resetModules();
    logInfo.mockClear();
    vi.stubEnv("FEATURE_REVENUE_ENFORCEMENT_V1", "");
    vi.stubEnv("FEATURE_REVENUE_DASHBOARD_V1", "");
    const m = await import("@/modules/revenue/revenue-monitoring.service");
    m.__resetRevenueMonitoringForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logs revenue events via logInfo", async () => {
    const { trackRevenueEvent } = await import("@/modules/revenue/revenue-events.service");
    trackRevenueEvent({
      type: "lead_viewed",
      userId: "u1",
      leadId: "l1",
      metadata: { source: "leads" },
    });
    expect(logInfo).toHaveBeenCalledWith(
      "[revenue]",
      expect.objectContaining({
        type: "lead_viewed",
        userId: "u1",
        leadId: "l1",
      }),
    );
  });

  it("updates monitoring when enforcement or dashboard flag is on", async () => {
    vi.stubEnv("FEATURE_REVENUE_DASHBOARD_V1", "1");
    const { trackRevenueEvent } = await import("@/modules/revenue/revenue-events.service");
    const mon = await import("@/modules/revenue/revenue-monitoring.service");
    trackRevenueEvent({
      type: "booking_started",
      userId: "u1",
      metadata: { source: "bnhub" },
    });
    expect(mon.getRevenueMonitoringSnapshot().bookingStarted).toBe(1);
  });
});
