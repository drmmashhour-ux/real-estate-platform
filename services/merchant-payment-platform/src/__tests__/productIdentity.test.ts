import assert from "node:assert/strict";
import test from "node:test";
import {
  createBrandIdentity,
  createDashboardReadModel,
  mockPosProducts,
  MockNexoraApiClient,
  nexoraBrand,
  renderFeesPage,
  renderOverviewPage,
  renderPosScaffold,
  renderReceiptCard,
  renderSettlementsPage,
  renderSettingsPage,
  renderTransactionsPage,
} from "../index.js";

test("Nexora brand identity exposes swappable tokens without financial dependencies", () => {
  assert.equal(nexoraBrand.brandName, "Nexora");
  assert.equal(nexoraBrand.themeMode, "light");
  assert.equal(nexoraBrand.tokens.colors.primary, "#3B82F6");
  assert.equal(nexoraBrand.tokens.colors.background, "#0B1220");
  assert.equal(nexoraBrand.tokens.colors.accent, "#14B8A6");

  const darkBrand = createBrandIdentity({
    brandName: "Nexora Partner",
    themeMode: "dark",
    supportContact: "support@partner.example",
  });

  assert.equal(darkBrand.brandName, "Nexora Partner");
  assert.equal(darkBrand.themeMode, "dark");
  assert.notEqual(darkBrand.tokens.colors.background, nexoraBrand.tokens.colors.background);
});

test("dashboard scaffold renders read-only pages from supplied ledger read models", () => {
  const readModel = createDashboardReadModel({
    merchantId: "merchant_001",
    merchantName: "Nexora Demo Merchant",
    feeBalanceMinor: 1234,
    platformFeeBps: 250,
    currency: "USD",
    now: new Date("2026-05-13T12:00:00.000Z"),
    transactions: [
      {
        id: "txn_001",
        merchantId: "merchant_001",
        provider: "mock_visa",
        money: { amountMinor: 10000, currency: "USD" },
        status: "recorded",
        ledgerTransactionIds: ["ledger_001"],
        createdAt: new Date("2026-05-13T10:00:00.000Z"),
      },
    ],
    settlements: [
      {
        id: "settlement_001",
        merchantId: "merchant_001",
        delay: "T+1",
        transactionIds: ["txn_001"],
        ledgerTransactionIds: ["ledger_002"],
        scheduledSettlementDate: new Date("2026-05-14T00:00:00.000Z"),
        status: "simulated",
      },
    ],
  });

  assert.equal(readModel.dailyVolumeMinor, 10000);
  assert.equal(readModel.revenueMinor, 10000);
  assert.match(renderOverviewPage(readModel, nexoraBrand), /Nexora/);
  assert.match(renderTransactionsPage(readModel, nexoraBrand), /mock_visa/);
  assert.match(renderSettlementsPage(readModel, nexoraBrand), /settlement_001/);
  assert.match(renderFeesPage(readModel, nexoraBrand), /Fee breakdown|Fee balance|250 bps/);
  assert.match(renderSettingsPage(readModel, nexoraBrand), /read-only/);
});

test("POS scaffold uses mock products and does not execute payments", () => {
  const html = renderPosScaffold(
    {
      merchantId: "merchant_001",
      products: mockPosProducts,
      amountInputMinor: 12500,
      checkoutStatus: "success",
      receipt: {
        merchantName: "Nexora Demo Merchant",
        amountMinor: 12500,
        currency: "USD",
        timestamp: new Date("2026-05-13T12:00:00.000Z"),
        transactionId: "txn_receipt_001",
        status: "success",
      },
    },
    nexoraBrand,
  );

  assert.match(html, /Nexora POS/);
  assert.match(html, /Presentation scaffold only/);
  assert.match(html, /Create transaction request/);
  assert.match(html, /txn_receipt_001/);
  assert.match(renderReceiptCard({
    merchantName: "Nexora Demo Merchant",
    amountMinor: 12500,
    currency: "USD",
    timestamp: new Date("2026-05-13T12:00:00.000Z"),
    transactionId: "txn_receipt_001",
    status: "success",
  }, nexoraBrand), /Digital receipt/);
});

test("mock Nexora API client exposes UI-only API consumption contract", async () => {
  const client = new MockNexoraApiClient();
  const transaction = await client.createPosTransaction({
    merchantId: "merchant_001",
    amountMinor: 5000,
    currency: "USD",
    idempotencyKey: "ui-idem-001",
  });
  const confirmed = await client.confirmPosTransaction(transaction.transactionId);
  const receipt = await client.getReceipt(confirmed.transactionId);

  assert.equal(transaction.status, "pending");
  assert.equal(confirmed.status, "success");
  assert.equal(receipt.status, "success");
});
