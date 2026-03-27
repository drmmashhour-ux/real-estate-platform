/**
 * Stripe and billing plan helper tests.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({ mocked: true }));
  return { default: MockStripe };
});

const stripeModule = await import("@/lib/stripe");
const plansModule = await import("@/lib/billing/plans");

describe("stripe helpers", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("returns null when stripe is not configured", () => {
    expect(stripeModule.getStripe()).toBeNull();
    expect(stripeModule.isStripeConfigured()).toBe(false);
  });

  it("creates a stripe client when configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = stripeModule.getStripe();
    expect(client).toBeTruthy();
    expect(stripeModule.isStripeConfigured()).toBe(true);
  });
});

describe("billing plans", () => {
  it("exposes plan metadata", () => {
    expect(plansModule.getPlanPrice("basic")).toBe(5);
    expect(plansModule.getPlanStorage("pro")).toBeGreaterThan(plansModule.getPlanStorage("basic"));
  });

  it("lists the expected plan keys", () => {
    expect(Object.keys(plansModule.plans)).toEqual(expect.arrayContaining(["free", "basic", "pro"]));
  });
});
