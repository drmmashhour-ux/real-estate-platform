import { describe, expect, it, vi, afterEach } from "vitest";

describe("brokerPricing env default", () => {
  const original = process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE;

  afterEach(() => {
    vi.resetModules();
    if (original === undefined) delete process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE;
    else process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE = original;
  });

  it("uses 100 when env unset", async () => {
    delete process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE;
    vi.resetModules();
    const { DEFAULT_BROKER_LEAD_PRICE } = await import("./brokerPricing");
    expect(DEFAULT_BROKER_LEAD_PRICE).toBe(100);
  });

  it("respects BROKER_ASSIGNED_LEAD_DEFAULT_PRICE", async () => {
    process.env.BROKER_ASSIGNED_LEAD_DEFAULT_PRICE = "250";
    vi.resetModules();
    const { DEFAULT_BROKER_LEAD_PRICE } = await import("./brokerPricing");
    expect(DEFAULT_BROKER_LEAD_PRICE).toBe(250);
  });
});
