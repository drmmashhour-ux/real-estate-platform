import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createLedgerAccount, LedgerEngine, renderMerchantDashboardHtml, renderPosHtml } from "../index.js";
import { assertFinancialSafety, createPaymentPlatform, getPaymentProvider } from "../index.js";

const LIVE_ENV_KEYS = [
  "PAYMENT_LIVE_MODE",
  "LIVE_PAYMENTS_ENABLED",
  "REAL_MONEY_ENABLED",
  "VISA_API_KEY",
  "VISA_SECRET_KEY",
  "MASTERCARD_API_KEY",
  "MASTERCARD_SECRET_KEY",
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

test("financial safety guard rejects live modes and live provider credentials", () => {
  assert.deepEqual(assertFinancialSafety({}), {
    mode: "mock",
    readOnly: true,
    liveExecutionAllowed: false,
    blockedKeys: [],
  });
  assert.throws(() => assertFinancialSafety({ PAYMENT_PLATFORM_MODE: "live" }), /mock mode/);
  assert.throws(() => assertFinancialSafety({ VISA_API_KEY: "live-key" }), /Live financial settings/);
  assert.throws(() => assertFinancialSafety({ LIVE_PAYMENTS_ENABLED: "true" }), /Live financial settings/);
});

test("ledger records only balanced immutable double-entry transactions", () =>
  withoutLiveEnv(() => {
    const ledger = new LedgerEngine();
    const settlement = ledger.addAccount(createLedgerAccount({ type: "settlement_account", currency: "USD" }));
    const merchant = ledger.addAccount(createLedgerAccount({ type: "merchant_account", currency: "USD" }));
    assert.throws(
      () =>
        ledger.recordTransaction({
          idempotencyKey: "bad-ledger",
          transactionId: "txn-bad",
          postings: [
            {
              accountId: settlement.id,
              accountType: "settlement_account",
              direction: "debit",
              money: { amountMinor: 1000, currency: "USD" },
            },
            {
              accountId: merchant.id,
              accountType: "merchant_account",
              direction: "credit",
              money: { amountMinor: 900, currency: "USD" },
            },
          ],
          auditEvent: {
            id: "audit",
            action: "bad",
            actor: "test",
            occurredAt: new Date(),
            correlationId: "corr",
            metadata: {},
          },
        }),
      /not balanced/,
    );
  }));

test("POS payment flow is mock-only and ledger-driven", async () =>
  withoutLiveEnv(async () => {
    const platform = createPaymentPlatform("USD");
    const merchant = platform.merchants.onboardMerchant({
      displayName: "Test merchant",
      currency: "USD",
      feeConfiguration: { platformFeeBps: 250 },
      settlementRules: { delay: "T+1" },
    });
    platform.merchants.updateMerchantStatus(merchant.id, "active");

    const created = await platform.pos.createTransaction({
      merchantId: merchant.id,
      provider: "mock_visa",
      amountMinor: 10_000,
      currency: "USD",
      idempotencyKey: "pos-idem-0001",
      correlationId: "corr-pos",
    });
    assert.equal("status" in created && created.status, "initiated");

    const confirmed = await platform.pos.confirmPayment({
      transactionId: "id" in created ? created.id : "",
      correlationId: "corr-pos",
    });
    assert.equal(confirmed.status, "recorded");
    assert.equal(confirmed.ledgerTransactionIds.length, 1);

    const receipt = await platform.pos.issueReceipt(confirmed.id);
    assert.equal(receipt.liveExecution, false);
    assert.equal(platform.ledger.getAccountBalance(merchant.accounts.merchantAccount.id), 9750);
    assert.equal(platform.ledger.getAccountBalance(platform.accounts.platformFeeAccount.id), 250);
  }));

test("settlement simulation creates ledger entries and completes lifecycle without money movement", async () =>
  withoutLiveEnv(async () => {
    const platform = createPaymentPlatform("USD");
    const merchant = platform.merchants.onboardMerchant({
      displayName: "Settlement merchant",
      currency: "USD",
      settlementRules: { delay: "T+2" },
    });
    platform.merchants.updateMerchantStatus(merchant.id, "active");
    const created = await platform.pos.createTransaction({
      merchantId: merchant.id,
      provider: "mock_bank_transfer",
      amountMinor: 20_000,
      currency: "USD",
      idempotencyKey: "pos-idem-0002",
      correlationId: "corr-settlement",
    });
    const confirmed = await platform.pos.confirmPayment({
      transactionId: "id" in created ? created.id : "",
      correlationId: "corr-settlement",
    });
    const batch = platform.settlements.simulateBatch({
      merchantId: merchant.id,
      transactionIds: [confirmed.id],
      idempotencyKey: "settlement-idem-0001",
      correlationId: "corr-settlement",
      now: new Date("2026-05-13T00:00:00.000Z"),
    });
    const settled = platform.transactions.getTransaction(confirmed.id);
    const completed = platform.transactions.complete(settled.id, "corr-settlement");
    assert.equal(batch.delay, "T+2");
    assert.equal(settled.status, "settled");
    assert.equal(completed.status, "completed");
    assert.equal(platform.ledger.getAccountBalance(merchant.accounts.merchantAccount.id), 0);
  }));

test("mock providers cannot execute live payments", async () =>
  withoutLiveEnv(async () => {
    const provider = getPaymentProvider("mock_mastercard");
    const result = await provider.authorize({
      provider: "mock_mastercard",
      transactionId: "txn-provider",
      merchantId: "merchant-provider",
      money: { amountMinor: 5000, currency: "USD" },
      idempotencyKey: "provider-idem-0001",
    });
    assert.equal(result.liveExecution, false);
    assert.throws(() => assertFinancialSafety({ MASTERCARD_SECRET_KEY: "secret" }), /Live financial settings/);
  }));

test("product layer branding is swappable and does not affect ledger state", async () =>
  withoutLiveEnv(async () => {
    const platform = createPaymentPlatform("USD", {
      brandName: "Acquirer Console",
      companyName: "Example Acquirer",
      supportEmail: "support@example.invalid",
      logoUrl: "https://example.invalid/acquirer.svg",
    });
    const registered = platform.product.onboarding.registerMerchant({
      displayName: "Dashboard merchant",
      currency: "USD",
      correlationId: "corr-onboarding",
    });
    platform.product.onboarding.submitMockKyc(registered.merchant.id, "corr-onboarding");
    platform.product.onboarding.approveMerchant(registered.merchant.id, "corr-onboarding");
    const created = await platform.pos.createTransaction({
      merchantId: registered.merchant.id,
      provider: "mock_visa",
      amountMinor: 12_000,
      currency: "USD",
      idempotencyKey: "pos-idem-product-0001",
      correlationId: "corr-product",
    });
    const recorded = await platform.pos.confirmPayment({
      transactionId: "id" in created ? created.id : "",
      correlationId: "corr-product",
    });
    const dashboard = platform.product.dashboard.getDashboard(registered.merchant.id);
    const dashboardHtml = renderMerchantDashboardHtml(dashboard, platform.product.brand);
    const posHtml = renderPosHtml(
      { merchantId: registered.merchant.id, availableProviders: ["mock_visa"] },
      platform.product.brand,
    );

    assert.equal(recorded.status, "recorded");
    assert.equal(dashboard.analytics.transactionCount, 1);
    assert.equal(dashboard.fees.feeAccountBalanceMinor, 300);
    assert.match(dashboardHtml, /Acquirer Console Merchant Dashboard/);
    assert.match(posHtml, /Point of Sale/);
    assert.equal(platform.ledger.getAccountBalance(registered.merchant.accounts.merchantAccount.id), 11_700);
  }));

test("API gateway routes onboarding, POS, dashboard, and brand through product services", async () =>
  withoutLiveEnv(async () => {
    const platform = createPaymentPlatform("USD");
    const server = platform.product.apiGateway.listen(0);
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      const merchantResponse = await postJson(`${baseUrl}/api/onboarding/merchants`, {
        displayName: "Gateway merchant",
        currency: "USD",
        platformFeeBps: 100,
        settlementDelay: "T+1",
        correlationId: "corr-gateway",
      });
      const merchantId = readNestedString(merchantResponse, ["merchant", "id"]);
      await postJson(`${baseUrl}/api/onboarding/merchants/approve`, {
        merchantId,
        correlationId: "corr-gateway",
      });
      const transaction = await postJson(`${baseUrl}/api/pos/transactions`, {
        merchantId,
        provider: "mock_mastercard",
        amountMinor: 7000,
        currency: "USD",
        idempotencyKey: "gateway-idem-0001",
        correlationId: "corr-gateway",
      });
      const transactionId = readNestedString(transaction, ["id"]);
      await postJson(`${baseUrl}/api/pos/payments/confirm`, {
        transactionId,
        correlationId: "corr-gateway",
      });
      const dashboard = await getJson(`${baseUrl}/api/dashboard?merchantId=${merchantId}`);
      const brand = await getJson(`${baseUrl}/api/brand`);

      assert.equal(readNestedString(brand, ["brandName"]), "MerchantPay");
      assert.equal(readNestedNumber(dashboard, ["analytics", "transactionCount"]), 1);
      assert.equal(readNestedNumber(dashboard, ["fees", "feeAccountBalanceMinor"]), 70);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }));

async function postJson(url: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<unknown>;
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<unknown>;
}

function readNestedString(value: unknown, path: readonly string[]): string {
  const nested = readNested(value, path);
  if (typeof nested !== "string") throw new Error(`Expected string at ${path.join(".")}.`);
  return nested;
}

function readNestedNumber(value: unknown, path: readonly string[]): number {
  const nested = readNested(value, path);
  if (typeof nested !== "number") throw new Error(`Expected number at ${path.join(".")}.`);
  return nested;
}

function readNested(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const segment of path) {
    assert.ok(current && typeof current === "object" && segment in current);
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
