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
    │   ├── api-gateway/productApiGateway.ts
    │   ├── audit/auditLogger.ts
    │   ├── auth
    │   │   ├── authService.ts
    │   │   ├── authTypes.ts
    │   │   └── mockJwt.ts
    │   ├── brand/brandConfig.ts
    │   ├── createProductizedPlatform.ts
    │   ├── dashboard
    │   │   ├── dashboardScaffold.ts
    │   │   └── viewModels.ts
    │   ├── design-system/tokens.ts
    │   ├── persistence/persistencePorts.ts
    │   ├── pos/posScaffold.ts
    │   ├── pos-integration/posApiClient.ts
    │   ├── services
    │   │   ├── dashboardProductService.ts
    │   │   ├── merchantProductService.ts
    │   │   ├── settlementProductService.ts
    │   │   └── transactionProductService.ts
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
- `ui/components.ts` — reusable cards, KPI tiles, buttons, status badges, and data tables.
- `receipt/receiptScaffold.ts` — digital receipt component with merchant name, amount, timestamp, transaction ID, and status.
- `pos/posScaffold.ts` — mock product list, amount input, checkout status, and receipt scaffold.
- `api-client/nexoraApiClient.ts` — UI-facing API consumption contract; mock implementation only.

This layer does not import the ledger engine, transaction service, settlement engine, provider registry, or safety guard. It accepts read models and renders HTML scaffolds only.

## Productization backend layer

The productization backend keeps the boundary `UI/POS -> API Gateway -> Product Services -> Financial Core`:

- `api-gateway/productApiGateway.ts` — unified typed gateway for `/transactions`, `/merchants`, `/settlements`, `/pos`, and `/dashboard`.
- `auth/*` — mock-safe JWT-like sessions and role-based access control for `admin` and `merchant`.
- `services/*ProductService.ts` — service facades that call financial core services. The gateway never calls the core directly.
- `persistence/persistencePorts.ts` — persistence port plus in-memory adapter for product records.
- `pos-integration/posApiClient.ts` — POS integration client that talks only to the API gateway.
- `audit/auditLogger.ts` — in-memory audit logger with correlation IDs.

The PostgreSQL persistence design lives in `prisma/schema.prisma`; it stores product users, sessions, merchant records, transaction metadata, settlement batches, and product audit logs. The financial ledger remains isolated in the core package.

## Production engineering layer

Nexora deployable skeletons live in the monorepo production structure:

- `apps/api-gateway` — typed product gateway entrypoint with safe runtime config, structured logs, and correlation IDs.
- `apps/dashboard` — dashboard shell app consuming product read models.
- `apps/pos` — POS shell app consuming gateway/product presentation contracts.
- `services/financial-core` — mock-only financial core runtime wrapper.
- `services/transaction-service` — transaction service runtime skeleton.
- `services/merchant-service` — merchant service runtime skeleton.
- `packages/shared-types` — shared API envelopes, runtime environment validation, correlation IDs, structured logger.
- `packages/ledger-core` — reusable ledger-core exports from the financial core package.

`services/auth-service` already exists in the parent monorepo, so the Nexora productization layer uses `product/auth/*` for mock JWT/RBAC and does not overwrite the existing service.

Docker orchestration is available with:

```bash
pnpm docker:nexora:up
```

CI/CD preparation is defined in `.github/workflows/nexora-production.yml`. It installs dependencies, lints, tests, and builds the Nexora packages/apps/services. It does not deploy.

## Commands

```bash
pnpm --filter @merchant-payments/platform test
pnpm --filter @merchant-payments/platform run build
pnpm --filter @merchant-payments/platform run lint
```
