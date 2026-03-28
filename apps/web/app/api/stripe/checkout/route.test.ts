import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/stripe/checkout", () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock("@/modules/bnhub-payments/services/paymentService", () => ({
  prepareReservationPaymentForCheckout: vi.fn(),
  attachCheckoutSessionToReservationPayment: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
    },
    propertyFraudScore: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/src/services/automation", () => ({
  onCheckoutStartAutomation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/modules/messaging/triggers", () => ({
  onMessagingTriggerCheckoutStarted: vi.fn().mockResolvedValue(undefined),
}));

import { getGuestId } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  prepareReservationPaymentForCheckout,
  attachCheckoutSessionToReservationPayment,
} from "@/modules/bnhub-payments/services/paymentService";

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(createCheckoutSession).mockResolvedValue({
      url: "https://checkout.stripe.com/session",
      sessionId: "cs_test_123",
    });
    vi.mocked(prepareReservationPaymentForCheckout).mockResolvedValue({
      ok: true,
      reservationPaymentId: "mp-pay-1",
      quoteId: "quote-1",
    });
    vi.mocked(attachCheckoutSessionToReservationPayment).mockResolvedValue(undefined);
    vi.mocked(prisma.propertyFraudScore.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.booking.findUnique).mockImplementation((args: { include?: unknown; select?: unknown }) => {
      if (args?.select && "listing" in (args.select as object)) {
        return Promise.resolve({
          listingId: "listing-1",
          listing: {
            owner: {
              stripeAccountId: "acct_test_connect",
              stripeOnboardingComplete: true,
            },
          },
        } as never);
      }
      return Promise.resolve({
        id: "booking-1",
        listingId: "listing-1",
        guestId: "user-1",
        status: "PENDING",
        listing: {
          securityDepositCents: 0,
          verificationStatus: "VERIFIED",
        },
        payment: {
          amountCents: 2500,
          status: "PENDING",
        },
      } as never);
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(false);
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 1000,
        paymentType: "booking",
        bookingId: "booking-1",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toMatch(/not configured/i);
  });

  it("returns 401 when user is not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 1000,
        paymentType: "booking",
        bookingId: "booking-1",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Sign in/i);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ amountCents: 1000 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 200 with url when checkout session is created", async () => {
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 2500,
        paymentType: "booking",
        bookingId: "booking-1",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session");
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 2500,
        bookingId: "booking-1",
        listingId: "listing-1",
        paymentType: "booking",
        userId: "user-1",
        connect: expect.objectContaining({
          destinationAccountId: "acct_test_connect",
          applicationFeeAmount: 375,
          bnhubPlatformFeeCents: 375,
          bnhubHostPayoutCents: 2125,
        }),
      })
    );
  });

  it("returns 409 when host has no Stripe Connect account", async () => {
    vi.mocked(prisma.booking.findUnique).mockImplementation((args: { include?: unknown; select?: unknown }) => {
      if (args?.select && "listing" in (args.select as object)) {
        return Promise.resolve({
          listingId: "listing-1",
          listing: {
            owner: {
              stripeAccountId: null,
              stripeOnboardingComplete: false,
            },
          },
        } as never);
      }
      return Promise.resolve({
        id: "booking-1",
        guestId: "user-1",
        status: "PENDING",
        payment: { amountCents: 2500, status: "PENDING" },
      } as never);
    });
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 2500,
        paymentType: "booking",
        bookingId: "booking-1",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/Host payout account is not configured/i);
  });

  it("returns 400 when bookingId is missing for booking payments", async () => {
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 2500,
        paymentType: "booking",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/bookingId/i);
  });

  it("returns 403 when user is not the booking guest", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: "booking-1",
      guestId: "other-user",
      status: "PENDING",
      payment: { amountCents: 2500, status: "PENDING" },
    } as never);
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        successUrl: "https://a.com/s",
        cancelUrl: "https://a.com/c",
        amountCents: 2500,
        paymentType: "booking",
        bookingId: "booking-1",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });
});
