import assert from "node:assert/strict";
import test from "node:test";
import {
  createPreparedSyriaTransaction,
  createSyriaFinancialAuditLog,
  getSyriaFinancialFeatureFlags,
  getSyriaPaymentProvider,
  redactFinancialSecrets,
  transitionSyriaTransaction,
} from "../index.js";

const bookingId = "11111111-1111-4111-8111-111111111111";
const payerId = "22222222-2222-4222-8222-222222222222";
const merchantId = "33333333-3333-4333-8333-333333333333";

test("Syria financial feature flags default off", () => {
  assert.deepEqual(getSyriaFinancialFeatureFlags({}), {
    FEATURE_SYRIA_WALLET: false,
    FEATURE_SYRIA_PAYOUTS: false,
    FEATURE_SYRIA_KYC: false,
    FEATURE_SYRIA_PROVIDER_QNB: false,
    FEATURE_SYRIA_PROVIDER_CHAMCASH: false,
    FEATURE_SYRIA_RISK_ENGINE: false,
  });
});

test("provider stubs validate but never execute live payments", async () => {
  const provider = getSyriaPaymentProvider("provider_chamcash_stub");
  const result = await provider.createPaymentIntent({
    bookingId,
    payerId,
    merchantId,
    amount: { amountMinor: 100_000, currency: "syp" },
    idempotencyKey: "idem_chamcash_0001",
    metadata: { channel: "preview" },
  });

  assert.equal(result.livePaymentExecuted, false);
  assert.equal(result.provider, "provider_chamcash_stub");
  assert.equal(result.status, "not_executed");
});

test("provider stubs reject raw card-like payloads", async () => {
  const provider = getSyriaPaymentProvider("provider_stub");
  await assert.rejects(
    provider.createPaymentIntent({
      bookingId,
      payerId,
      merchantId,
      amount: { amountMinor: 50_000, currency: "SYP" },
      idempotencyKey: "idem_sensitive_0001",
      metadata: { note: "4242 4242 4242 4242" },
    }),
    /Raw card/,
  );
});

test("transaction engine is runtime validated and transition safe", () => {
  const transaction = createPreparedSyriaTransaction({
    provider: "provider_stub",
    amount: { amountMinor: 75_000, currency: "SYP" },
    bookingId,
    payerId,
    merchantId,
    idempotencyKey: "idem_transaction_0001",
    metadata: { purpose: "booking_hold" },
    correlationId: "corr-transaction-test",
    actor: { actorType: "system" },
  });

  const authorized = transitionSyriaTransaction(transaction, "authorized", {
    action: "transaction.authorized",
    actor: { actorType: "provider" },
    correlationId: "corr-transaction-test",
    occurredAt: new Date(),
    details: {},
  });

  assert.equal(authorized.status, "authorized");
  assert.throws(
    () =>
      transitionSyriaTransaction(authorized, "refunded", {
        action: "transaction.invalid",
        actor: { actorType: "system" },
        correlationId: "corr-transaction-test",
        occurredAt: new Date(),
        details: {},
      }),
    /Cannot transition/,
  );
});

test("audit logs redact sensitive metadata", () => {
  const auditLog = createSyriaFinancialAuditLog({
    category: "api_failure",
    action: "financial_api.rejected",
    actor: { actorType: "system" },
    requestCorrelationId: "corr-audit-test",
    metadata: { cardToken: "tok_preview_secret", reason: "sensitive_payload" },
  });

  assert.equal(auditLog.immutable, true);
  assert.equal(auditLog.metadata.cardToken, "[REDACTED]");
  assert.deepEqual(redactFinancialSecrets({ nested: { cvv: "123" } }), {
    nested: { cvv: "[REDACTED]" },
  });
});
