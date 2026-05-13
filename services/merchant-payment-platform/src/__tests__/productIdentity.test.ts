import assert from "node:assert/strict";
import test from "node:test";
import {
  createBrandIdentity,
  createDashboardReadModel,
  mockPosProducts,
  nexoraBrand,
  renderOverviewPage,
  renderPosScaffold,
  renderSettlementsPage,
  renderSettingsPage,
  renderTransactionsPage,
} from "../index.js";

test("Nexora brand identity exposes swappable tokens without financial dependencies", () => {
  assert.equal(nexoraBrand.brandName, "Nexora");
  assert.equal(nexoraBrand.themeMode, "light");
  assert.equal(nexoraBrand.tokens.colors.primary, "#635BFF");

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
  assert.match(renderOverviewPage(readModel, nexoraBrand), /Nexora/);
  assert.match(renderTransactionsPage(readModel, nexoraBrand), /mock_visa/);
  assert.match(renderSettlementsPage(readModel, nexoraBrand), /settlement_001/);
  assert.match(renderSettingsPage(readModel, nexoraBrand), /read-only/);
});

test("POS scaffold uses mock products and does not execute payments", () => {
  const html = renderPosScaffold(
    {
      merchantId: "merchant_001",
      products: mockPosProducts,
      checkoutStatus: "idle",
    },
    nexoraBrand,
  );

  assert.match(html, /Nexora POS/);
  assert.match(html, /Presentation scaffold only/);
  assert.match(html, /Create transaction request/);
});
