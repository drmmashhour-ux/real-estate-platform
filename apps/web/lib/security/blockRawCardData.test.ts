import { describe, expect, it } from "vitest";
import { hasRawCardLikePayload } from "./blockRawCardData";

describe("raw card payload detection", () => {
  it("blocks direct raw PAN and CVC payloads", () => {
    expect(
      hasRawCardLikePayload({
        number: "4242 4242 4242 4242",
        exp_month: "12",
        exp_year: "2030",
        cvc: "123",
      })
    ).toBe(true);
  });

  it("blocks nested payment method data", () => {
    expect(hasRawCardLikePayload({ checkout: { payment_method_data: { type: "card" } } })).toBe(
      true
    );
  });

  it("does not block Stripe-safe card summaries", () => {
    expect(
      hasRawCardLikePayload({
        card: {
          brand: "visa",
          last4: "4242",
          exp_month: 12,
          exp_year: 2030,
        },
      })
    ).toBe(false);
  });
});
