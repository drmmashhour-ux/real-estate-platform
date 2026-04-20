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

## i18n (Arabic-first, English optional)

- **Default locale:** Arabic (`ar`). Routes use next-intl with **locale prefix** `/ar/...` and `/en/...`.
- **English (`en`):** UI copy loads from `messages/en.json`; listing **English title/description are optional**. When missing, the UI falls back to Arabic fields (`titleAr`, `descriptionAr`) — Arabic is never substituted by English for authoring rules.
- **RTL:** `<html lang dir>` plus `[dir="rtl"]` utilities in `src/app/globals.css`; body gets `darlink-root-rtl` / `darlink-root-ltr`.
- **Locale toggle:** `LocaleToggle` switches locale while staying on the current path (next-intl router).
- **Server helpers:** `src/lib/i18n/helpers.ts` (`getLocalizedValue`, `normalizeSyriaLocale`), `locale-resolver.ts` supports `?lang=` / `?locale=` query (used by server utilities; primary UX is path prefix).
- **Types:** `SyriaLocale`, `LocalizedText`, `SYRIA_I18N_CONFIG` in `src/lib/i18n/types.ts` / `config.ts`.

## Bilingual property fields (Prisma)

`SyriaProperty` stores:

- Required: `titleAr`, `descriptionAr`; optional: `titleEn`, `descriptionEn` (existing).
- Location display: optional `cityAr`, `cityEn`, `districtAr`, `districtEn`; legacy **`city`** remains the canonical English catalog key for search; **`area`** remains legacy district/area storage.

Apply migration (non-destructive):

```bash
pnpm --filter @lecipm/syria exec prisma migrate deploy
# or during dev:
pnpm --filter @lecipm/syria prisma:push
```

Then re-seed sample rows if needed:

```bash
pnpm --filter @lecipm/syria db:seed
```

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
