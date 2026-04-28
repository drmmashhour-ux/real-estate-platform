import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

vi.mock("@/lib/stripe/guestSupabaseBooking", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe/guestSupabaseBooking")>(
    "@/lib/stripe/guestSupabaseBooking"
  );
  return {
    ...actual,
    createGuestSupabaseBookingCheckoutSession: vi.fn(),
  };
});

vi.mock("@/lib/stripe/hostPayoutReadiness", () => ({
  BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE:
    "Host payout is not configured yet. Booking checkout is temporarily unavailable.",
  BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE: "HOST_PAYOUT_NOT_READY",
  validateHostStripePayoutReadiness: vi.fn(),
}));

vi.mock("@/lib/bnhub/booking-pricing", () => ({
  computeBookingPricing: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    booking: {
      findUnique: vi.fn(),
    },
    payment: {
      update: vi.fn().mockResolvedValue({}),
    },
    propertyFraudScore: {
      findUnique: vi.fn(),
    },
  })
}));

vi.mock("@/src/services/automation", () => ({
  onCheckoutStartAutomation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/modules/messaging/triggers", () => ({
  onMessagingTriggerCheckoutStarted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/src/modules/launch/persistLaunchEvent", () => ({
  persistLaunchEvent: vi.fn().mockResolvedValue(undefined),
}));

import { getGuestId } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { createGuestSupabaseBookingCheckoutSession } from "@/lib/stripe/guestSupabaseBooking";
import { validateHostStripePayoutReadiness } from "@/lib/stripe/hostPayoutReadiness";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  prepareReservationPaymentForCheckout,
  attachCheckoutSessionToReservationPayment,
} from "@/modules/bnhub-payments/services/paymentService";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    process.env.PRODUCTION_LOCK_MODE = "true";
    process.env.PAYMENTS_ENABLED = "true";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(createGuestSupabaseBookingCheckoutSession).mockReset();
    vi.mocked(validateHostStripePayoutReadiness).mockResolvedValue({
      ok: true,
      code: "READY",
      userMessage: "",
      logDetail: "",
    });
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
      const sel = args?.select as Record<string, unknown> | undefined;
      if (sel && "checkIn" in sel) {
        return Promise.resolve({
          listingId: "listing-1",
          checkIn: new Date("2025-06-01T15:00:00.000Z"),
          checkOut: new Date("2025-06-05T11:00:00.000Z"),
        } as never);
      }
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

  it("returns checkout url for guest Supabase booking without sign-in (bookingId only)", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    vi.mocked(createGuestSupabaseBookingCheckoutSession).mockResolvedValue({
      url: "https://checkout.stripe.com/guest",
      sessionId: "cs_guest_1",
    });
    const req = new Request("http://x/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ bookingId: "550e8400-e29b-41d4-a716-446655440000" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/guest");
    expect(createGuestSupabaseBookingCheckoutSession).toHaveBeenCalled();
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
        connect: undefined,
      })
    );
  });

  it("TEMP_DISABLE_CONNECT: allows booking checkout without host Connect (no connect payload)", async () => {
    vi.mocked(validateHostStripePayoutReadiness).mockResolvedValue({
      ok: false,
      code: "HOST_PAYOUT_NOT_CONFIGURED",
      userMessage:
        "Host payout is not configured yet. Booking checkout is temporarily unavailable.",
      logDetail: "host_missing_stripe_account_id",
    });
    vi.mocked(prisma.booking.findUnique).mockImplementation((args: { include?: unknown; select?: unknown }) => {
      const sel = args?.select as Record<string, unknown> | undefined;
      if (sel && "checkIn" in sel) {
        return Promise.resolve({
          listingId: "listing-1",
          checkIn: new Date("2025-06-01T15:00:00.000Z"),
          checkOut: new Date("2025-06-05T11:00:00.000Z"),
        } as never);
      }
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
    expect(res.status).toBe(200);
    expect(vi.mocked(validateHostStripePayoutReadiness)).not.toHaveBeenCalled();
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: "booking",
        connect: undefined,
      })
    );
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

  describe("checkout rails latch", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns 503 when PRODUCTION_LOCK_MODE is not true", async () => {
      vi.stubEnv("PRODUCTION_LOCK_MODE", "false");
      vi.stubEnv("PAYMENTS_ENABLED", "true");
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
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe("production_lock_disabled");
    });

    it("returns 503 when PAYMENTS_ENABLED is false", async () => {
      vi.stubEnv("PRODUCTION_LOCK_MODE", "true");
      vi.stubEnv("PAYMENTS_ENABLED", "false");
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
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.code).toBe("payments_disabled");
    });
  });
});
