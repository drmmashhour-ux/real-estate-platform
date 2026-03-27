import { describe, expect, it } from "vitest";
import { mrrCentsFromStripeSubscription } from "./stripeMrrCents";

describe("mrrCentsFromStripeSubscription", () => {
  it("returns monthly unit for month interval", () => {
    const sub = {
      items: { data: [{ price: { unit_amount: 4900, recurring: { interval: "month" as const } } }] },
    };
    expect(mrrCentsFromStripeSubscription(sub as never)).toBe(4900);
  });

  it("annual price is normalized to monthly cents", () => {
    const sub = {
      items: { data: [{ price: { unit_amount: 120000, recurring: { interval: "year" as const } } }] },
    };
    expect(mrrCentsFromStripeSubscription(sub as never)).toBe(10000);
  });

  it("returns null when no price", () => {
    const sub = { items: { data: [{}] } };
    expect(mrrCentsFromStripeSubscription(sub as never)).toBeNull();
  });
});
