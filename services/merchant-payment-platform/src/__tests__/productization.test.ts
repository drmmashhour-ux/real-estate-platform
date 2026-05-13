import assert from "node:assert/strict";
import test from "node:test";
import { createProductizedPlatform, PosApiClient } from "../index.js";

const LIVE_ENV_KEYS = [
  "PAYMENT_LIVE_MODE",
  "LIVE_PAYMENTS_ENABLED",
  "REAL_MONEY_ENABLED",
  "VISA_API_KEY",
  "VISA_SECRET_KEY",
  "MASTERCARD_API_KEY",
  "MASTERCARD_SECRET_KEY",
  "BANK_API_KEY",
  "BANK_TRANSFER_API_KEY",
  "QNB_API_KEY",
  "STRIPE_SECRET_KEY",
] as const;

function withoutLiveEnv<T>(callback: () => T): T {
  const previous = new Map<string, string | undefined>();
  for (const key of LIVE_ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  previous.set("PAYMENT_PLATFORM_MODE", process.env["PAYMENT_PLATFORM_MODE"]);
  process.env["PAYMENT_PLATFORM_MODE"] = "mock";
  try {
    return callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("API gateway routes merchant onboarding, POS, transactions, settlements, and dashboard through services", async () =>
  withoutLiveEnv(async () => {
    const platform = createProductizedPlatform("USD");
    const admin = platform.product.auth.createUser({ email: "admin@nexora.example", role: "admin" });
    const adminSession = platform.product.auth.createSession(admin.id);

    const merchantResponse = await platform.product.apiGateway.handle({
      method: "POST",
      path: "/merchants",
      token: adminSession.token,
      correlationId: "corr-productization",
      body: {
        displayName: "Gateway merchant",
        currency: "USD",
        platformFeeBps: 100,
        settlementDelay: "T+1",
      },
    });
    assert.equal(merchantResponse.status, 201);
    const merchant = merchantResponse.body as { id: string };

    await platform.product.apiGateway.handle({
      method: "PATCH",
      path: "/merchants/activate",
      token: adminSession.token,
      correlationId: "corr-productization",
      body: { merchantId: merchant.id },
    });

    const merchantUser = platform.product.auth.createUser({
      email: "merchant@nexora.example",
      role: "merchant",
      merchantId: merchant.id,
    });
    const merchantSession = platform.product.auth.createSession(merchantUser.id);
    const posClient = new PosApiClient(platform.product.apiGateway, merchantSession.token);

    const createdResponse = await posClient.createTransaction({
      merchantId: merchant.id,
      provider: "mock_visa",
      amountMinor: 10_000,
      currency: "USD",
      idempotencyKey: "productization-idem-001",
      correlationId: "corr-productization",
    });
    assert.equal(createdResponse.status, 201);
    const transaction = createdResponse.body as { id: string };

    const confirmedResponse = await posClient.confirmTransaction({
      transactionId: transaction.id,
      correlationId: "corr-productization",
    });
    assert.equal(confirmedResponse.status, 200);

    const dashboardResponse = await platform.product.apiGateway.handle({
      method: "GET",
      path: "/dashboard",
      token: merchantSession.token,
      correlationId: "corr-productization",
      query: { merchantId: merchant.id },
    });
    assert.equal(dashboardResponse.status, 200);
    assert.equal(
      (dashboardResponse.body as { dailyVolumeMinor: number; feeBalanceMinor: number }).dailyVolumeMinor,
      10_000,
    );

    const settlementResponse = await platform.product.apiGateway.handle({
      method: "POST",
      path: "/settlements",
      token: adminSession.token,
      correlationId: "corr-productization",
      body: {
        merchantId: merchant.id,
        transactionIds: [transaction.id],
        idempotencyKey: "settlement-productization-001",
      },
    });
    assert.equal(settlementResponse.status, 201);

    const receiptResponse = await posClient.fetchReceipt({
      transactionId: transaction.id,
      correlationId: "corr-productization",
    });
    assert.equal(receiptResponse.status, 200);
    assert.equal((receiptResponse.body as { liveExecution: false }).liveExecution, false);

    assert.equal(platform.product.persistence.users.size, 2);
    assert.equal(platform.product.persistence.merchants.size, 1);
    assert.equal(platform.product.persistence.transactions.size, 1);
    assert.equal(platform.product.persistence.settlements.size, 1);
    assert.ok(platform.product.audit.list().length >= 6);
  }));

test("merchant role cannot access another merchant through the gateway", async () =>
  withoutLiveEnv(async () => {
    const platform = createProductizedPlatform("USD");
    const admin = platform.product.auth.createUser({ email: "admin2@nexora.example", role: "admin" });
    const adminSession = platform.product.auth.createSession(admin.id);
    const merchantResponse = await platform.product.apiGateway.handle({
      method: "POST",
      path: "/merchants",
      token: adminSession.token,
      correlationId: "corr-rbac",
      body: { displayName: "RBAC merchant", currency: "USD" },
    });
    const merchant = merchantResponse.body as { id: string };
    const user = platform.product.auth.createUser({
      email: "other@nexora.example",
      role: "merchant",
      merchantId: "different_merchant",
    });
    const session = platform.product.auth.createSession(user.id);

    await assert.rejects(
      platform.product.apiGateway.handle({
        method: "GET",
        path: "/merchants",
        token: session.token,
        correlationId: "corr-rbac",
        query: { merchantId: merchant.id },
      }),
      /Merchant access denied/,
    );
  }));
