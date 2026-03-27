# Accounting & tax module (admin)

## Overview

The web app includes a **financial workspace** for **ADMIN** and **ACCOUNTANT** roles:

- **Financial dashboard** (`/admin/finance`) — revenue aggregates, Stripe-backed payments, ledger preview, CSV/PDF export.
- **Tax documents** (`/admin/finance/tax`) — generated records (invoices, receipts, commission reports, tax summaries) with optional PDF download.
- **Stripe sync** — webhook handlers extend `PlatformPayment` (fees, refunds) and append **`StripeLedgerEntry`** rows for idempotent reconciliation.
- **Audit trail** — **`FinancialAuditLog`** records sensitive finance API actions.

**ACCOUNTANT** users see a reduced admin home with links to finance, tax, commissions, income, and transactions only. They must **not** self-register as accountant; assign **`PlatformRole.ACCOUNTANT`** in the database or via an admin-only flow.

## Database

After pulling changes, run:

```bash
cd apps/web && npx prisma migrate dev
# or prisma db push (non-prod)
npx prisma generate
```

Models: `StripeLedgerEntry`, `FinancialAuditLog`, `TaxDocument` (+ `status`, `issueDate`), `BrokerPayout`, `BrokerPayoutLine`, extended `PlatformPayment` (+ `updatedAt`, fees/refunds), enum `ACCOUNTANT`, enum `BrokerPayoutStatus`.

See also **`docs/FINANCE_MODULE_IMPLEMENTATION_REPORT.md`** for the full module map, APIs, and limitations.

## Environment

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` / webhook signing secret | Stripe API + webhook verification |
| `CRON_SECRET` or `FINANCE_AUTOMATION_SECRET` | Bearer for `POST /api/admin/finance/automation` (cron) |
| `ADMIN_ALERT_EMAIL` / `ACCOUNTANT_ALERT_EMAIL` | Optional recipients when automation emails reports |

## Exports

- **CSV** — transactions and revenue-style rollups.
- **PDF** — simple text layout via `jspdf` (not statutory tax forms).
- **“Excel”** — CSV with Excel-friendly MIME; add a real **xlsx** library if you need native workbooks.

## Compliance disclaimer (Canada / Quebec)

This system produces **internal financial and summary artifacts**. It does **not** replace a **CPA** or legal advice. **GST/QST**, income reporting, T-slips, and jurisdictional rules must be validated by a qualified accountant for your entity and province.

## Risks & gaps

1. **Tax slips** — Generated summaries are **informational**; they are not CRA/Revenu Québec official slips.
2. **Stripe coverage** — Only events wired in the webhook (e.g. checkout completion, refunds) are guaranteed; expand for disputes, payouts, and Connect if used.
3. **PII in logs** — Audit metadata should stay minimal; avoid full card or bank data in `metadata`.
4. **Role drift** — Any new admin route that exposes payouts or PII must call **`isFinancialStaff`** / **`getFinanceActor()`** consistently.

## First accountant user

Set a user’s `role` to `ACCOUNTANT` in the database (or add a guarded admin API). Ensure they can sign in and reach `/admin`.

---

## Tenant / agency CRM finance (workspace-scoped)

Separate from platform admin accounting above, **broker workspaces** use **tenant-scoped** financial records:

- **Models** — `Tenant`, `TenantMembership`, `DealFinancial`, `CommissionSplit`, `TenantInvoice` (table `tenant_invoices`; distinct from subscription `Invoice`), `PaymentRecord`, `TenantBillingProfile`.
- **UI** — `/dashboard/finance/*`, `/dashboard/tenant` (workspace switcher + team).
- **API** — `/api/tenants/*`, `/api/tenants/current` (header badge), `/api/tenants/[id]/billing`, `/api/finance/*` (session required; `x-tenant-id` or cookie `lecipm_tenant_id`).

Apply migrations after `schema.prisma` changes; run `npx prisma generate` in the repo.
