# Broker GST / QST registration (Quebec / Canada)

## What this module does

- Collects **BN (9 digits)**, optional **GST** (`123456789RT0001`), and **QST** (`1234567890TQ0001` when province is **QC**) plus legal/business name and address.
- Validates **format only** — no CRA or Revenu Québec API calls.
- Workflow: **Submitted** → **Approved** or **Rejected** via **Admin / Accountant** (manual internal review only).
- On Stripe **platform payments** with a `brokerId` in session metadata, stores a **JSON snapshot** on `PlatformPayment.brokerTaxSnapshot` if a registration row exists.
- **Platform invoices** store `invoiceTaxDetails` for display (broker lines + optional `PLATFORM_TAX_REGISTRATION_NOTE` env).

## Environment

| Variable | Purpose |
|----------|---------|
| `PLATFORM_TAX_REGISTRATION_NOTE` | Optional text shown on invoices / platform revenue summaries (e.g. platform BN/GST if you publish it). |

## Security

- **GET/PUT** `/api/broker/tax-registration` — authenticated **BROKER** (own record only).
- **GET** `/api/admin/broker-tax`, **PATCH** `/api/admin/broker-tax/[userId]` — **ADMIN** or **ACCOUNTANT** only.

## UI

- Broker: **Dashboard → Tax (GST/QST)** → `/dashboard/broker/tax-information`
- Staff: **Admin → Broker tax (GST/QST)** → `/admin/broker-tax`
- Onboarding broker steps include a link to the tax page.

## Limitations

- **No tax amount calculation** — GST/QST on amounts is not computed unless you add explicit rules later.
- **Snapshot timing** — Stored at payment completion from the current registration row; historical changes are not retrofitted on old payments.
- **Commission rows** do not duplicate tax numbers; use payment snapshot or joined registration for reports.

## Disclaimer (also in product UI)

Tax numbers are provided by the broker. The platform does not guarantee their validity with Revenu Québec or the CRA.
