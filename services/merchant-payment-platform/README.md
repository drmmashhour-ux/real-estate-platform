# Merchant Payment Platform

Brand-agnostic, mock-only merchant payment infrastructure for POS, payment authorization, double-entry ledgering, settlement simulation, and receipts.

## Safety posture

- No real payment execution is possible by default.
- `PAYMENT_PLATFORM_MODE` must be unset or `mock`.
- Live provider credentials and live execution flags are rejected at initialization and provider execution time.
- Providers are mock-only: `MockVisaProvider`, `MockMastercardProvider`, `MockBankTransferProvider`.
- Financial state is ledger-derived only. No direct balance mutation API exists.
- All payment flows go through immutable balanced ledger transactions before receipts or settlement.

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

## POS MVP API

The Node HTTP API exposes:

- `POST /pos/transactions`
- `POST /pos/payments/confirm`
- `POST /pos/receipts`

Offline mode is supported by passing `offline: true` to transaction creation; the request is queued rather than processed.

## Bank/provider readiness

The `PaymentProvider` interface is ready for future bank/card adapter review, but production adapters are intentionally absent. Visa, Mastercard, and bank transfer are represented only by mock providers. Any attempt to enable live credentials is rejected by `assertFinancialSafety`.

## Commands

```bash
pnpm --filter @merchant-payments/platform test
pnpm --filter @merchant-payments/platform run build
pnpm --filter @merchant-payments/platform run lint
```
