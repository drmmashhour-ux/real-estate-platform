import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { markOrchestratedPaymentFromStripeSession } from "@/lib/payments/webhook-bridge";
import { verifyCloverHostedCheckoutSignature } from "@/lib/payments/clover/verifyWebhookSignature";
import { parseCloverHostedCheckoutWebhook } from "@/lib/payments/clover/parseWebhook";
import { executeOrchestratedPayout } from "@/lib/payments/payout";

const orchestratedFindFirst = vi.fn();
const orchestratedUpdateMany = vi.fn();
const payoutFindUnique = vi.fn();
const payoutUpdateMany = vi.fn();
const userFindUnique = vi.fn();
const transferCreate = vi.fn();
const bookingFindUnique = vi.fn();
const refundAggregate = vi.fn();
const refundCount = vi.fn();
const hostSnapFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    orchestratedPayment: {
      findFirst: (...a: unknown[]) => orchestratedFindFirst(...a),
      updateMany: (...a: unknown[]) => orchestratedUpdateMany(...a),
    },
    orchestratedPayout: {
      findUnique: (...a: unknown[]) => payoutFindUnique(...a),
      updateMany: (...a: unknown[]) => payoutUpdateMany(...a),
      update: vi.fn(),
    },
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
    },
    booking: {
      findUnique: (...a: unknown[]) => bookingFindUnique(...a),
    },
    bnhubMarketplaceRefund: {
      aggregate: (...a: unknown[]) => refundAggregate(...a),
      count: (...a: unknown[]) => refundCount(...a),
    },
    hostStripeAccountSnapshot: {
      findUnique: (...a: unknown[]) => hostSnapFindUnique(...a),
    },
    $transaction: async (fn: (tx: unknown) => Promise<string>) => fn({}),
  },
}));

vi.mock("@/lib/markets", () => ({
  getResolvedMarket: vi.fn(() =>
    Promise.resolve({
      code: "default",
      defaultCurrency: "CAD",
      paymentMode: "online",
      bookingMode: "standard",
      contactDisplayMode: "standard",
      onlinePaymentsEnabled: true,
      manualPaymentTrackingEnabled: false,
      contactFirstEmphasis: false,
      suggestedDefaultLocale: "en-CA",
      legalDisclaimerMessageKey: "default",
    })
  ),
}));

vi.mock("@/lib/stripe/connect/persist-snapshot", () => ({
  refreshHostStripeAccountSnapshotForHost: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/payments/money-events", () => ({
  persistMoneyEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

const emitPaymentSuccess = vi.fn();
const emitPaymentFailed = vi.fn();
const emitPayoutSent = vi.fn();

vi.mock("@/lib/payments/launch-events", () => ({
  emitPaymentSuccess: (...a: unknown[]) => emitPaymentSuccess(...a),
  emitPaymentFailed: (...a: unknown[]) => emitPaymentFailed(...a),
  emitPayoutSent: (...a: unknown[]) => emitPayoutSent(...a),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    transfers: {
      create: (...a: unknown[]) => transferCreate(...a),
    },
  }),
  isStripeConfigured: () => true,
}));

describe("markOrchestratedPaymentFromStripeSession", () => {
  beforeEach(() => {
    orchestratedFindFirst.mockReset();
    orchestratedUpdateMany.mockReset();
    emitPaymentSuccess.mockReset();
    emitPaymentFailed.mockReset();
  });

  it("applies once and skips duplicate delivery (idempotent)", async () => {
    let dbStatus: "pending" | "succeeded" = "pending";
    orchestratedFindFirst.mockImplementation(() =>
      Promise.resolve({
        id: "op1",
        paymentType: "listing_upgrade",
        userId: "u1",
        bookingId: null,
        amountCents: 1000,
        status: dbStatus,
      })
    );
    orchestratedUpdateMany.mockImplementation(() => {
      if (dbStatus !== "pending") return Promise.resolve({ count: 0 });
      dbStatus = "succeeded";
      return Promise.resolve({ count: 1 });
    });

    const a = await markOrchestratedPaymentFromStripeSession({
      sessionId: "cs_test_1",
      succeeded: true,
      stripePaymentIntentId: "pi_1",
      stripeEventId: "evt_1",
    });
    const b = await markOrchestratedPaymentFromStripeSession({
      sessionId: "cs_test_1",
      succeeded: true,
      stripePaymentIntentId: "pi_1",
      stripeEventId: "evt_1",
    });

    expect(a.applied).toBe(true);
    expect(b.applied).toBe(false);
    expect(emitPaymentSuccess).toHaveBeenCalledTimes(1);
  });

  it("normalizes failure once for non-terminal row", async () => {
    orchestratedFindFirst.mockResolvedValue({
      id: "op2",
      paymentType: "office_payment",
      userId: "u1",
      bookingId: null,
      amountCents: 500,
      status: "pending",
    });
    orchestratedUpdateMany.mockResolvedValue({ count: 1 });

    await markOrchestratedPaymentFromStripeSession({
      sessionId: "cs_fail",
      succeeded: false,
      stripeEventId: "evt_fail",
    });

    expect(emitPaymentFailed).toHaveBeenCalledTimes(1);
  });
});

describe("executeOrchestratedPayout", () => {
  beforeEach(() => {
    payoutFindUnique.mockReset();
    payoutUpdateMany.mockReset();
    userFindUnique.mockReset();
    transferCreate.mockReset();
    emitPayoutSent.mockReset();
    bookingFindUnique.mockReset();
    refundAggregate.mockReset();
    refundCount.mockReset();
    hostSnapFindUnique.mockReset();
    bookingFindUnique.mockResolvedValue({
      refunded: false,
      listingId: "l1",
      listing: { ownerId: "h1" },
      payment: {
        status: "COMPLETED",
        moneyBreakdownJson: null,
      },
    });
    refundAggregate.mockResolvedValue({ _sum: { amountCents: null } });
    refundCount.mockResolvedValue(0);
    hostSnapFindUnique.mockResolvedValue({ payoutsEnabled: true });
  });

  it("refuses duplicate execution when providerRef already set", async () => {
    payoutFindUnique.mockResolvedValue({
      id: "po1",
      provider: "stripe",
      providerRef: "tr_existing",
      hostId: "h1",
      amountCents: 100,
      currency: "cad",
      status: "sent",
      bookingId: "b1",
    });

    const r = await executeOrchestratedPayout("po1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.transferId).toBe("tr_existing");
    expect(transferCreate).not.toHaveBeenCalled();
  });

  it("uses Stripe idempotency key on transfer", async () => {
    payoutFindUnique.mockResolvedValue({
      id: "po2",
      provider: "stripe",
      providerRef: null,
      hostId: "h1",
      amountCents: 200,
      currency: "cad",
      status: "scheduled",
      bookingId: "b1",
    });
    userFindUnique.mockResolvedValue({ stripeAccountId: "acct_abc", stripeOnboardingComplete: true });
    transferCreate.mockResolvedValue({ id: "tr_new" });
    payoutUpdateMany.mockResolvedValue({ count: 1 });

    await executeOrchestratedPayout("po2");

    expect(transferCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 200,
        destination: "acct_abc",
      }),
      { idempotencyKey: "orch_payout_po2" }
    );
    expect(emitPayoutSent).toHaveBeenCalled();
  });
});

describe("Clover webhook verification", () => {
  it("accepts valid Clover-Signature", () => {
    const secret = "whsec_test";
    const raw = '{"status":"APPROVED"}';
    const t = "1700000000";
    const v1 = createHmac("sha256", secret).update(`${t}.${raw}`, "utf8").digest("hex");
    const header = `t=${t},v1=${v1}`;
    expect(verifyCloverHostedCheckoutSignature(raw, header, secret)).toBe(true);
  });

  it("rejects bad signature", () => {
    expect(verifyCloverHostedCheckoutSignature("{}", "t=1,v1=deadbeef", "secret")).toBe(false);
  });
});

describe("parseCloverHostedCheckoutWebhook", () => {
  it("detects approved payment", () => {
    const p = parseCloverHostedCheckoutWebhook({
      checkoutSessionId: "sess-1",
      status: "APPROVED",
      id: "pay-1",
    });
    expect(p.checkoutSessionId).toBe("sess-1");
    expect(p.approved).toBe(true);
    expect(p.failed).toBe(false);
  });
});
