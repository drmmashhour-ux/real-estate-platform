import { describe, expect, it } from "vitest";
import { getCancellationPolicy, isMarketplaceStayCompletedOrPast } from "../cancellation-policy";

describe("Order 59.1 — getCancellationPolicy", () => {
  const june10 = new Date(2026, 5, 10);
  const june12 = new Date(2026, 5, 12);
  const at = new Date(2026, 5, 1, 12, 0, 0, 0);

  it("flexible: >24h before check-in → 100% of paid total", () => {
    const p = getCancellationPolicy(
      {
        startDate: june10,
        endDate: june12,
        status: "confirmed",
        totalPaidCents: 10_000,
        policyType: "flexible",
      },
      at
    );
    expect(p.refundPercent).toBe(100);
    expect(p.refundableAmount).toBe(10_000);
    expect(p.type).toBe("flexible");
  });

  it("flexible: within 24h → 50%", () => {
    const fewHours = new Date(2026, 5, 9, 20, 0, 0, 0);
    const p = getCancellationPolicy(
      {
        startDate: june10,
        endDate: june12,
        status: "confirmed",
        totalPaidCents: 2000,
        policyType: "flexible",
      },
      fewHours
    );
    expect(p.refundPercent).toBe(50);
    expect(p.refundableAmount).toBe(1000);
  });

  it("strict: >7d → 50%, else 0", () => {
    const weekBefore = new Date(2026, 5, 1, 12, 0, 0, 0);
    const p1 = getCancellationPolicy(
      {
        startDate: june10,
        endDate: june12,
        status: "confirmed",
        totalPaidCents: 10_000,
        policyType: "strict",
      },
      weekBefore
    );
    expect(p1.refundPercent).toBe(50);
    const late = new Date(2026, 5, 8, 12, 0, 0, 0);
    const p2 = getCancellationPolicy(
      {
        startDate: june10,
        endDate: june12,
        status: "confirmed",
        totalPaidCents: 10_000,
        policyType: "strict",
      },
      late
    );
    expect(p2.refundPercent).toBe(0);
  });

  it("pending and expired → no refund in policy (defensive)", () => {
    const p1 = getCancellationPolicy({
      startDate: june10,
      endDate: june12,
      status: "pending",
      totalPaidCents: 5_000,
    });
    expect(p1.refundableAmount).toBe(0);
    const p2 = getCancellationPolicy({
      startDate: june10,
      endDate: june12,
      status: "expired",
      totalPaidCents: 5_000,
    });
    expect(p2.refundableAmount).toBe(0);
  });
});

describe("isMarketplaceStayCompletedOrPast", () => {
  it("is false before checkout day (end exclusive)", () => {
    const end = new Date(2026, 5, 12);
    const at = new Date(2026, 5, 10);
    expect(isMarketplaceStayCompletedOrPast({ endDate: end }, at)).toBe(false);
  });

  it("is true on or after end date (local)", () => {
    const end = new Date(2026, 5, 12);
    const at = new Date(2026, 5, 12, 8, 0, 0, 0);
    expect(isMarketplaceStayCompletedOrPast({ endDate: end }, at)).toBe(true);
  });
});

describe("default policy (MARKETPLACE_DEFAULT_CANCELLATION_POLICY)", () => {
  const prev = process.env.MARKETPLACE_DEFAULT_CANCELLATION_POLICY;
  afterEach(() => {
    if (prev === undefined) delete process.env.MARKETPLACE_DEFAULT_CANCELLATION_POLICY;
    else process.env.MARKETPLACE_DEFAULT_CANCELLATION_POLICY = prev;
  });

  it("uses strict when env set to strict (when policyType omitted)", () => {
    process.env.MARKETPLACE_DEFAULT_CANCELLATION_POLICY = "strict";
    const j10 = new Date(2026, 5, 10);
    const j12 = new Date(2026, 5, 12);
    const p = getCancellationPolicy(
      {
        startDate: j10,
        endDate: j12,
        status: "confirmed",
        totalPaidCents: 1000,
      },
      new Date(2026, 5, 1)
    );
    expect(p.type).toBe("strict");
  });
});
