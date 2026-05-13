# Merchant Payment Financial Core

Brand-agnostic, mock-only foundation layer for merchant payment accounting with a decoupled Nexora brand and product presentation layer.

## Safety posture

- No real payment execution or money movement.
- `PAYMENT_PLATFORM_MODE` must be unset or `mock`.
- Live provider credentials and live execution flags are rejected at initialization and provider execution time.
- Providers are mock-only: `MockVisaProvider`, `MockMastercardProvider`, `MockBankProvider`.
- Financial state is ledger-derived only. No wallet balance mutation API exists.
- All recorded and settled financial operations are immutable double-entry ledger transactions.
- Product UI scaffolds are presentation-only and must consume API/read-model data; they do not execute payments.

## Folder structure

```text
services/merchant-payment-platform
├── README.md
├── package.json
├── tsconfig.json
└── src
    ├── index.ts
    ├── __tests__/platform.test.ts
    ├── domain
    │   ├── ledger
    │   │   ├── accounts.ts
    │   │   ├── ledgerEngine.ts
    │   │   └── types.ts
    │   ├── merchants
    │   │   ├── merchantService.ts
    │   │   └── types.ts
    │   ├── providers
    │   │   ├── mockProviders.ts
    │   │   ├── paymentProvider.ts
    │   │   └── providerRegistry.ts
    │   ├── settlements
    │   │   ├── feeCalculator.ts
    │   │   ├── settlementEngine.ts
    │   │   └── types.ts
    │   ├── shared/types.ts
    │   └── transactions
    │       ├── transactionService.ts
    │       └── types.ts
    ├── infrastructure/createPaymentPlatform.ts
    ├── product
    │   ├── brand/brandConfig.ts
    │   ├── dashboard
    │   │   ├── dashboardScaffold.ts
    │   │   └── viewModels.ts
    │   ├── design-system/tokens.ts
    │   ├── pos/posScaffold.ts
    │   └── ui
    │       ├── html.ts
    │       └── layout/dashboardShell.ts
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

- `initiated`: transaction shell with merchant, provider, amount, and idempotency key.
- `authorized`: mock provider authorization only.
- `recorded`: balanced ledger transaction created; platform fee is deducted through ledger postings.
- `settled`: T+1/T+2 settlement simulation records another balanced ledger transaction.
- `completed`: final lifecycle marker after settlement.

## Merchant core

Merchants have a status of `pending`, `active`, or `suspended`, plus per-merchant fee configuration and settlement rules.

## Provider abstraction

The `PaymentProvider` interface is ready for future bank/card adapter review, but production adapters are intentionally absent. Visa, Mastercard, and bank payment paths are represented only by mock providers. Any attempt to enable live credentials is rejected by `assertFinancialSafety`.

## Settlement and reconciliation

Settlement batches simulate T+1/T+2 processing, generate ledger-backed settlement postings, and can produce mocked reconciliation reports with `liveMoneyMoved: false`.

## Nexora product identity layer

The product layer is fully decoupled from financial core logic. It includes:

- `brand/brandConfig.ts` — central Nexora identity with brand name, logo placeholder, support contact, light/dark theme mode, and design tokens.
- `design-system/tokens.ts` — reusable colors, spacing, border radius, and typography tokens.
- `ui/layout/dashboardShell.ts` — dashboard shell, sidebar navigation, and topbar rendering.
- `dashboard/dashboardScaffold.ts` — scaffold pages for Overview, Transactions, Settlements, and Settings.
- `dashboard/viewModels.ts` — read-only view model shaping from supplied ledger/transaction/settlement data.
- `pos/posScaffold.ts` — mock product list, checkout screen, and digital receipt scaffold.

This layer does not import the ledger engine, transaction service, settlement engine, provider registry, or safety guard. It accepts read models and renders HTML scaffolds only.

## Commands

```bash
pnpm --filter @merchant-payments/platform test
pnpm --filter @merchant-payments/platform run build
pnpm --filter @merchant-payments/platform run lint
```
