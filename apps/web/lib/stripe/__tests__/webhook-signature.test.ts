/**
 * Stripe SDK signature round-trip: invalid / tampered payloads must fail verification.
 */
import { describe, expect, it } from "vitest";
import Stripe from "stripe";

describe("Stripe webhook signature (SDK)", () => {
  const secret = "whsec_test_unit_secret_32chars_xx";
  const stripe = new Stripe("sk_test_unit_fake_key_for_webhook_tests_only", {
    typescript: true,
  });

  const payload = JSON.stringify({
    id: "evt_test_webhook",
    object: "event",
    type: "billing_portal.session.created",
    data: { object: { id: "bps_1" } },
  });

  it("constructEvent accepts generateTestHeaderString for same payload and secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.id).toBe("evt_test_webhook");
  });

  it("constructEvent rejects tampered body", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => stripe.webhooks.constructEvent(`${payload} `, header, secret)).toThrow();
  });

  it("constructEvent rejects wrong secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => stripe.webhooks.constructEvent(payload, header, `${secret}wrong`)).toThrow();
  });
});
