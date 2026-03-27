# Master financial system — implementation report

_Last updated: 2026-03-19_

## Platform GST/QST storage (secure pattern)

- **Database:** `PlatformFinancialSettings` — editable by admin; source of truth when fields are non-empty.
- **Environment (server-only):** `PLATFORM_LEGAL_NAME`, `PLATFORM_GST_NUMBER`, `PLATFORM_QST_NUMBER` — merged when DB fields are empty (`mergePlatformTaxRegistrationFromEnv` / `getPlatformFinancialSettings()`). **Never** use `NEXT_PUBLIC_*` for these.
- **Invoices:** Numbers and legal name are written into `invoiceTaxDetails` + line breakdown at webhook time; customer copy via authenticated `/api/billing/platform-invoices` only.
- **Print template:** `lib/billing/platform-invoice-print-html.ts` — legal name, GST, QST, per-line GST/QST, totals.

## What works

| Area | Status | Notes |
|------|--------|--------|
| **ACCOUNTANT + ADMIN finance access** | Partial | `getFinanceActor()` / routes gate financial APIs; verify all UI routes use the same helper. |
| **Broker vs platform revenue separation** | Core done | `PartyRevenueLedgerEntry` (`party_revenue_ledger_entries`): one row per party per payment slice; **distinct** from revenue-intelligence `RevenueLedgerEntry`. |
| **Platform GST/QST settings** | Core done | `PlatformFinancialSettings` singleton; admin API `PATCH /api/admin/finance/platform-settings` (admin-only for writes). |
| **Quebec tax engine** | Core done | `lib/tax/quebec-tax-engine.ts` — exclusive + inclusive (QST on GST-inclusive base), rounding. |
| **Invoices from webhooks** | Core done | Stripe webhook → commission split → party ledger → `buildInvoiceForPlatformPayment` → `PlatformInvoice` + `taxCalculationJson` on payment. |
| **Broker tax profile** | Done | `BrokerTaxRegistration` + validation patterns (GST `RT`, QST `TQ`). |
| **Tax verification states** | Done | Statuses include staff review; **no CRA/RQ API claims** in copy. |
| **Stripe sync fields** | Partial | Fees/refunds on `PlatformPayment`; `StripeLedgerEntry` for events. |
| **Broker payouts** | Partial | `BrokerPayout` / `BrokerPayoutLine`; manual workflow emphasis. |
| **Financial audit log** | Partial | `FinancialAuditLog` + `logFinancialAction` on overview / key actions. |
| **Finance overview API** | Fixed | Includes `partyRevenueLedgerEntry.groupBy` by `party` (was missing from `Promise.all`). |

## Issues fixed in this pass

- **Duplicate Prisma model**: Renamed accounting ledger from `RevenueLedgerEntry` to **`PartyRevenueLedgerEntry`** to avoid collision with existing **Revenue Intelligence** `RevenueLedgerEntry`.
- **Overview bug**: `ledgerByParty` was destructured but **no sixth query** was in `Promise.all` — added `prisma.partyRevenueLedgerEntry.groupBy`.

## Known gaps / follow-ups

1. **Migrations**: Run `prisma migrate deploy` (or `db push` in dev) so `party_revenue_ledger_entries`, `platform_financial_settings`, and new columns exist. Migration: `20260319200000_party_revenue_ledger_finance`.
2. **PostgreSQL version**: Enum `ADD VALUE IF NOT EXISTS` requires **PostgreSQL 15+**; adjust SQL if on older PG.
3. **Historical data**: Party ledger only fills for **new** successful payments after deploy; dashboards should keep disclaimers.
4. **Tax vs Stripe**: Invoice/tax totals may differ slightly from Stripe by cents; `taxCalculationJson` can document variance.
5. **Exports**: PDF/CSV/Excel pipelines — confirm each route checks ACCOUNTANT/ADMIN and audits exports.
6. **Tests**: Add unit tests for `quebec-tax-engine`, webhook invoice path, and finance permissions.

## Risks

| Risk | Mitigation |
|------|------------|
| Wrong role sees PII/revenue | Centralize `getFinanceActor`; never expose finance JSON publicly. |
| Mixing broker/platform money | Enforce writes only via `createRevenueLedgerForPayment` + clear `party` enum. |
| “Official” tax language | UI/API copy: internal records only; accountant validates. |
| Enum migration failure | Test migrate on staging; backup before production. |

## Financial metrics (API shape)

`GET /api/admin/finance/overview` returns gross payment totals, monthly slice, `revenueBySource`, **separate** `revenueLedger.platformCents` / `brokerCents`, Stripe fees, refunds, failed count, commission-based broker/platform split fields, and a disclaimer.

## Revenue status

- **Platform**: Subscription/listing/service/deal fees → `PLATFORM` party rows + platform lines on invoices when configured.
- **Broker**: Commission share → `BROKER` party rows; broker GST/QST on invoice when profile present and rules apply.

---

**Goal alignment**: Auditable structure, GST/QST configuration, separated ledger, invoices, payout tracking — **complete** at architecture level; **operational completeness** depends on running migrations, UI polish, exports, and automated tests as above.
