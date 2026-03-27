# Demo accounts

Password for every seeded demo user: **`Demo123!`** (override with `DEMO_FULL_PASSWORD` when running `npm run demo:full`).

Load the dataset from `apps/web`:

```bash
cd apps/web && npm run demo:full
```

Use **`DEMO_FULL_CLEAR=1`** only when you want to replace the Prestige/Urban demo tenants and re-seed users.

## Account table

| Role (story) | Name | Email | Password | Tenant |
|--------------|------|-------|----------|--------|
| Admin (tenant owner) | Sarah Johnson | sarah@prestige.demo | Demo123! | Prestige Realty Group |
| Broker (primary story) | David Miller | david@prestige.demo | Demo123! | Prestige Realty Group |
| Broker | Emily Carter | emily@prestige.demo | Demo123! | Prestige Realty Group |
| Assistant | Alex Nguyen | alex@prestige.demo | Demo123! | Prestige Realty Group |
| Client (buyer) | Michael Chen | michael@client.demo | Demo123! | Prestige Realty Group |
| Client (seller + Urban flows) | Emma Wells | emma@client.demo | Demo123! | Prestige Realty Group & Urban Property Advisors |
| Admin | Lisa Brown | lisa@urban.demo | Demo123! | Urban Property Advisors |
| Broker | James Wilson | james@urban.demo | Demo123! | Urban Property Advisors |

## How to log in

1. **Normal login** — Open `/auth/login`, enter email and password (`Demo123!` after `demo:full`).
2. **Quick login (staging / demo)** — When `NEXT_PUBLIC_ENV=staging` or `DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE` is enabled, use the **Login as Admin / Broker / Client** buttons on the login page, or **Admin → Demo accounts** (`/dashboard/admin/demo-accounts`) to switch users.

## When to use each account

- **Sarah (admin)** — Tenant settings, analytics, finance overview, admin-only tools.
- **David (broker)** — Main CRM, listings, offers, contracts, messages, appointments, and deal pipeline for the Prestige story.
- **Emily** — Second broker on the same tenant (multi-broker scenarios).
- **Alex** — Assistant workflows (tasks, internal coordination).
- **Michael** — Buyer client experience (intake, documents, messages).
- **Emma** — Secondary client flows (seller side + Urban buyer); appears in both tenants.
- **Lisa / James** — Urban Property Advisors admin and broker scenarios.

## Staging reset

`DEMO_RESET_KEEP_EMAILS` (see `lib/demo-reset.ts`) defaults to the comma-separated list in `demo-account-constants.ts` plus `demo@platform.com`, so demo users are preserved across `resetDemoDatabase` when configured.
