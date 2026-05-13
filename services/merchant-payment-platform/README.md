# Merchant Payment Platform

Brand-agnostic, mock-only merchant payment infrastructure for POS, payment authorization, double-entry ledgering, settlement simulation, receipts, merchant onboarding, dashboard read models, and configurable branding.

## Safety posture

- No real payment execution is possible by default.
- `PAYMENT_PLATFORM_MODE` must be unset or `mock`.
- Live provider credentials and live execution flags are rejected at initialization and provider execution time.
- Providers are mock-only: `MockVisaProvider`, `MockMastercardProvider`, `MockBankTransferProvider`.
- Financial state is ledger-derived only. No direct balance mutation API exists.
- All payment flows go through immutable balanced ledger transactions before receipts or settlement.
- Product UI modules are read-model/rendering layers and never mutate balances directly.

## Folder structure

```text
services/merchant-payment-platform
├── README.md
├── package.json
├── tsconfig.json
└── src
    ├── app.ts
    ├── index.ts
    ├── server.ts
    ├── __tests__/platform.test.ts
    ├── domain
    │   ├── ledger
    │   │   ├── accounts.ts
    │   │   ├── ledgerEngine.ts
    │   │   └── types.ts
    │   ├── merchants
    │   │   ├── merchantService.ts
    │   │   └── types.ts
    │   ├── pos
    │   │   ├── offlineQueue.ts
    │   │   ├── posHttpApi.ts
    │   │   ├── posService.ts
    │   │   └── receipt.ts
    │   ├── providers
    │   │   ├── mockProviders.ts
    │   │   ├── paymentProvider.ts
    │   │   └── providerRegistry.ts
    │   ├── settlements
    │   │   ├── settlementEngine.ts
    │   │   └── types.ts
    │   ├── shared/types.ts
    │   └── transactions
    │       ├── transactionService.ts
    │       └── types.ts
    ├── infrastructure/createPaymentPlatform.ts
    ├── product
    │   ├── api-gateway/apiGateway.ts
    │   ├── brand/brandConfig.ts
    │   ├── createProductLayer.ts
    │   ├── dashboard
    │   │   ├── dashboardService.ts
    │   │   └── dashboardUi.ts
    │   ├── onboarding/onboardingService.ts
    │   └── pos-ui/posUi.ts
    └── safety/financialSafetyGuard.ts
```

## Ledger model

Supported account types:

- `merchant_account`
- `platform_fee_account`
- `settlement_account`

Every ledger transaction must contain at least two postings, use one currency, and balance total debits with total credits. Ledger entries are append-only objects. Balances are calculated from ledger entries with `LedgerEngine.getAccountBalance(accountId)`.

## Transaction lifecycle

```text
initiated -> authorized -> recorded -> settled -> completed
```

- `initiated`: created by POS with an idempotency key.
- `authorized`: mock provider authorization only.
- `recorded`: balanced ledger transaction created; platform fee is deducted through ledger postings.
- `settled`: T+1/T+2 settlement simulation records another balanced ledger transaction.
- `completed`: final lifecycle marker after settlement.

## Product and brand layer

Branding lives in `product/brand/brandConfig.ts` and includes company name, support email, logo placeholder, currency display settings, theme, colors, typography, and spacing tokens. The brand config is injected into product renderers and cannot affect ledger, transaction, provider, or settlement logic.

Merchant dashboard read models come from the financial core:

- Transactions: from `TransactionService.listTransactions()`.
- Settlements: from `SettlementEngine.listBatches()`.
- Fees and balances: from `LedgerEngine.getAccountBalance()`.
- Daily/weekly analytics: computed from transaction read models, not wallet mutation.

The POS UI is an HTML renderer that posts to the API gateway and does not compute balances or fees.

## API gateway and POS MVP API

The Node HTTP API exposes:

- `GET /api/brand`
- `GET /api/dashboard?merchantId=...`
- `GET /api/integrations/health`
- `POST /api/onboarding/merchants`
- `POST /api/onboarding/kyc/submit`
- `POST /api/onboarding/merchants/approve`
- `POST /api/onboarding/merchants/reject`
- `POST /api/pos/transactions`
- `POST /api/pos/payments/confirm`
- `POST /api/pos/receipts`
- `GET /ui/dashboard?merchantId=...`
- `GET /ui/pos?merchantId=...`

Offline mode is supported by passing `offline: true` to transaction creation; the request is queued rather than processed.

## Bank/provider readiness

The `PaymentProvider` interface is ready for future bank/card adapter review, but production adapters are intentionally absent. Visa, Mastercard, and bank transfer are represented only by mock providers. Any attempt to enable live credentials is rejected by `assertFinancialSafety`.

## Commands

```bash
pnpm --filter @merchant-payments/platform test
pnpm --filter @merchant-payments/platform run build
pnpm --filter @merchant-payments/platform run lint
```
