# Darlink — Syria app (`apps/syria`)

Consumer marketplace for Syria under the **Darlink / دارلينك** product identity: buy, long-term rent, and BNHub-style stays where enabled — manual-first payments and admin-controlled payouts (no Stripe).

## Darlink product identity

- **Darlink** is the Syria-facing product name for this app (`apps/syria`). It uses its **own theme, UX, and positioning** — isolated from LECIPM black/gold branding.
- Canonical brand rules live in **`docs/syria-platform/darlink-brand.md`**.
- **`apps/web`** interacts with Syria data only via **read-only** intelligence layers (adapters, preview, dashboards). It does **not** drive Syria marketplace execution from the web app.
- **Execution** (authored flows, bookings, payouts, admin operations) runs **inside `apps/syria`** against the `syria_*` schema — not from `apps/web`.

## Stack

- Next.js App Router (`src/app`)
- Tailwind CSS v4
- Prisma 6 with **custom client output** `src/generated/prisma` (does not replace `@lecipm/web`’s Prisma client)
- PostgreSQL via `DATABASE_URL` — tables are prefixed/mapped as `syria_*`

## Setup

From repository root:

```bash
pnpm install

# Push Syria schema (same DATABASE_URL as web — adds syria_* tables only)
pnpm --filter @lecipm/syria prisma:push

pnpm --filter @lecipm/syria prisma:generate
pnpm --filter @lecipm/syria db:seed
```

Copy `.env.example` to `.env.local` and point `DATABASE_URL` at your Postgres instance.

## Run

```bash
pnpm --filter @lecipm/syria dev
```

Opens [http://localhost:3002](http://localhost:3002).

Or from root (if `dev:syria` script is present):

```bash
pnpm dev:syria
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Homepage |
| `/buy`, `/rent`, `/bnhub/stays` | Browse |
| `/sell` | Submit listing (pending review) |
| `/listing/[id]` | Public listing / BNHub booking form |
| `/login` | Email cookie session |
| `/dashboard`, `/dashboard/listings`, `/dashboard/bookings`, `/dashboard/payments` | User hub |
| `/admin`, `/admin/listings`, `/admin/bookings`, `/admin/payouts`, `/admin/users` | Operations |

## Payments

- Listing fees & guest stays: **manual** reference + optional proof URL fields; admin verifies.
- Placeholder gateway: `POST /api/payments/gateway-placeholder` returns a synthetic reference only.

## Safety

- `AUTO_PAYOUT_ENABLED` defaults **false** — no automated host disbursement in-app.
- Payout ledger: admin **Approve** → **Mark paid (manual)** after offline settlement.
