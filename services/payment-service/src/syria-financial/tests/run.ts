import assert from "node:assert/strict";
import {
  FinancialError,
  applySyriaWalletLedgerEntry,
  createMerchantProfile,
  createSyriaTransaction,
  createSyriaWallet,
  defaultSyriaFinancialFeatureFlags,
  evaluateSyriaRiskSignals,
  getSyriaPaymentProvider,
  readSyriaFinancialFeatureFlags,
  transitionSyriaTransaction,
} from "../index.js";

const correlation = {
  correlationId: "corr-test-001",
  idempotencyKey: "idem-test-001",
};

const systemActor = {
  actorType: "system" as const,
  actorId: "system-test",
};

assert.deepEqual(readSyriaFinancialFeatureFlags({}), defaultSyriaFinancialFeatureFlags);

const transaction = createSyriaTransaction({
  provider: "provider_stub",
  amount: 25_000,
  currency: "syp",
  bookingId: "booking-001",
  payerId: "payer-001",
  merchantId: "merchant-001",
  idempotencyKey: correlation.idempotencyKey,
  metadata: { bookingSource: "test" },
  actor: systemActor,
  correlation,
});

assert.equal(transaction.currency, "SYP");
assert.equal(transaction.status, "pending");
assert.equal(transaction.auditTrail.length, 1);

const authorized = transitionSyriaTransaction(transaction, "authorized", systemActor, correlation);
assert.equal(authorized.status, "authorized");
assert.equal(authorized.auditTrail.length, 2);
assert.throws(
  () => transitionSyriaTransaction(authorized, "pending", systemActor, correlation),
  FinancialError,
);

assert.throws(
  () =>
    createSyriaTransaction({
      provider: "provider_stub",
      amount: 1,
      currency: "SYP",
      bookingId: "booking-raw-card",
      payerId: "payer-001",
      merchantId: "merchant-001",
      metadata: { cardNumber: "4111111111111111" },
      actor: systemActor,
      correlation,
    }),
  /Raw card data/,
);

const wallet = createSyriaWallet("merchant-001", "syp");
assert.deepEqual(wallet.balances, { available: 0, pending: 0, payout: 0, refund: 0, hold: 0 });

const walletWithHold = applySyriaWalletLedgerEntry(wallet, {
  immutableTransactionId: transaction.id,
  referenceType: "transaction",
  referenceId: transaction.id,
  balanceDelta: { hold: 25_000 },
  correlation,
});
assert.equal(walletWithHold.balances.hold, 25_000);
assert.throws(
  () =>
    applySyriaWalletLedgerEntry(walletWithHold, {
      immutableTransactionId: transaction.id,
      referenceType: "transaction",
      referenceId: transaction.id,
      balanceDelta: { hold: 1 },
      correlation,
    }),
  FinancialError,
);

const provider = getSyriaPaymentProvider("provider_stub");
const providerResult = await provider.createPaymentIntent({
  amount: 25_000,
  currency: "SYP",
  bookingId: "booking-001",
  payerId: "payer-001",
  merchantId: "merchant-001",
  idempotencyKey: correlation.idempotencyKey,
  metadata: {},
  correlation,
});
assert.equal(providerResult.liveMode, false);
assert.equal(providerResult.executed, false);

assert.throws(
  () => getSyriaPaymentProvider("provider_qnb_stub"),
  /feature flag/,
);

assert.throws(
  () => createMerchantProfile({ merchantId: "merchant-001", displayName: "Merchant" }),
  /disabled/,
);

const activeFlags = { ...defaultSyriaFinancialFeatureFlags, FEATURE_SYRIA_RISK_ENGINE: true };
const riskSignals = evaluateSyriaRiskSignals(
  {
    subjectId: "payer-001",
    idempotencyKey: "dupe",
    recentIdempotencyKeys: ["dupe"],
    paymentAttemptsInWindow: 5,
    failureCountInWindow: 3,
    providerFailureRatePercent: 25,
    correlation,
  },
  activeFlags,
);
assert.equal(riskSignals.length, 4);
assert.ok(riskSignals.every((signal) => signal.passiveOnly));

console.log("Syria financial foundation targeted checks passed.");
