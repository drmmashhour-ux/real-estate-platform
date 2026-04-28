import { describe, it, expect, beforeEach } from "vitest";
import {
  getCheckoutRailsBlockReason,
  getIngressProductionLockReason,
  isPaymentsEnabled,
  isProductionLockMode,
} from "./flags";
import { PAYMENT_RAILS_MESSAGES, requireCheckoutRailsOpen, requireProductionLockForPaymentIngress } from "./route-guards";

describe("payment-readiness rails", () => {
  beforeEach(() => {
    delete process.env.PRODUCTION_LOCK_MODE;
    delete process.env.PAYMENTS_ENABLED;
  });

  it("checkout: missing PRODUCTION_LOCK_MODE blocks with production_lock_disabled", () => {
    expect(getCheckoutRailsBlockReason()).toBe("production_lock_disabled");
    const once = requireCheckoutRailsOpen();
    expect(once?.status).toBe(503);
    expect(once?.headers.get("content-type")).toContain("application/json");
  });

  it("checkout: PAYMENTS_ENABLED=false blocks even when PRODUCTION_LOCK_MODE=true", () => {
    process.env.PRODUCTION_LOCK_MODE = "true";
    process.env.PAYMENTS_ENABLED = "false";
    expect(isProductionLockMode()).toBe(true);
    expect(isPaymentsEnabled()).toBe(false);
    expect(getCheckoutRailsBlockReason()).toBe("payments_disabled");
    const res = requireCheckoutRailsOpen();
    expect(res?.status).toBe(503);
  });

  it("checkout: allows both rails when PRODUCTION_LOCK_MODE=true and PAYMENTS_ENABLED=true", () => {
    process.env.PRODUCTION_LOCK_MODE = "true";
    process.env.PAYMENTS_ENABLED = "true";
    expect(getCheckoutRailsBlockReason()).toBe(null);
    expect(requireCheckoutRailsOpen()).toBe(null);
  });

  it("ingress: blocks when PRODUCTION_LOCK_MODE is not true (ignores PAYMENTS_ENABLED)", () => {
    process.env.PRODUCTION_LOCK_MODE = "false";
    process.env.PAYMENTS_ENABLED = "true";
    expect(getIngressProductionLockReason()).toBe("production_lock_disabled");
    expect(requireProductionLockForPaymentIngress()?.status).toBe(503);
  });

  it("ingress: allows when PRODUCTION_LOCK_MODE=true even if PAYMENTS_ENABLED=false", () => {
    process.env.PRODUCTION_LOCK_MODE = "true";
    process.env.PAYMENTS_ENABLED = "false";
    expect(getIngressProductionLockReason()).toBe(null);
    expect(requireProductionLockForPaymentIngress()).toBe(null);
  });

  it("maps human-readable latch messages", () => {
    expect(PAYMENT_RAILS_MESSAGES.production_lock_disabled.length).toBeGreaterThan(10);
    expect(PAYMENT_RAILS_MESSAGES.payments_disabled.length).toBeGreaterThan(10);
  });
});
