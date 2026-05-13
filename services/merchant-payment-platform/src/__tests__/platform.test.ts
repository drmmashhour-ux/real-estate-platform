import assert from "node:assert/strict";
import test from "node:test";
import { createLedgerAccount, LedgerEngine } from "../index.js";
import { assertFinancialSafety, createPaymentPlatform, getPaymentProvider } from "../index.js";

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

test("transaction flow is mock-only, idempotent, and ledger-driven", async () =>
  withoutLiveEnv(async () => {
    const platform = createPaymentPlatform("USD");
    const merchant = platform.merchants.onboardMerchant({
      displayName: "Test merchant",
      currency: "USD",
      feeConfiguration: { platformFeeBps: 250 },
      settlementRules: { delay: "T+1" },
    });
    platform.merchants.updateMerchantStatus(merchant.id, "active");

    const created = platform.transactions.initiate({
      merchantId: merchant.id,
      provider: "mock_visa",
      money: { amountMinor: 10_000, currency: "USD" },
      idempotencyKey: "core-idem-0001",
      correlationId: "corr-core",
    });
    const duplicate = platform.transactions.initiate({
      merchantId: merchant.id,
      provider: "mock_visa",
      money: { amountMinor: 10_000, currency: "USD" },
      idempotencyKey: "core-idem-0001",
      correlationId: "corr-core",
    });
    assert.equal(duplicate.id, created.id);
    assert.equal(created.status, "initiated");

    const authorized = await platform.transactions.authorize(created.id, "corr-core");
    const recorded = platform.transactions.record(authorized.id, "corr-core");

    assert.equal(recorded.status, "recorded");
    assert.equal(recorded.ledgerTransactionIds.length, 1);
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
    const created = platform.transactions.initiate({
      merchantId: merchant.id,
      provider: "mock_bank",
      money: { amountMinor: 20_000, currency: "USD" },
      idempotencyKey: "core-idem-0002",
      correlationId: "corr-settlement",
    });
    const authorized = await platform.transactions.authorize(created.id, "corr-settlement");
    const recorded = platform.transactions.record(authorized.id, "corr-settlement");
    const batch = platform.settlements.simulateBatch({
      merchantId: merchant.id,
      transactionIds: [recorded.id],
      idempotencyKey: "settlement-idem-0001",
      correlationId: "corr-settlement",
      now: new Date("2026-05-13T00:00:00.000Z"),
    });
    const reconciliation = platform.settlements.reconcileBatch(batch.id, "corr-settlement");
    const settled = platform.transactions.getTransaction(recorded.id);
    const completed = platform.transactions.complete(settled.id, "corr-settlement");
    assert.equal(batch.delay, "T+2");
    assert.equal(reconciliation.matched, true);
    assert.equal(reconciliation.liveMoneyMoved, false);
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
