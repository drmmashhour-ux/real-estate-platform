# Demo run checklist

Use this for investor demos, QA, and onboarding. Requires database access and `DATABASE_URL` for `apps/web`.

## 1. Seed full demo data

From repo root or `apps/web`:

```bash
cd apps/web
DEMO_FULL_CLEAR=1 npm run demo:full
```

- **First run / replace existing demo:** keep `DEMO_FULL_CLEAR=1`.
- **Password:** `Demo123!` unless `DEMO_FULL_PASSWORD` is set in `.env`.

## 2. Accounts to use

See **`docs/demo/DEMO_ACCOUNTS.md`** for the full table. Short list:

| Persona | Email | Password |
|---------|-------|----------|
| Admin / tenant owner (Prestige) | `sarah@prestige.demo` | `Demo123!` (or env) |
| Primary broker (Prestige) | `david@prestige.demo` | same |
| Primary client (Michael Chen) | `michael@client.demo` | same |
| Urban broker | `james@urban.demo` | same |
| Platform admin | *(your staging admin)* | *(your creds)* |

## 3. First page to open

As **any user:** `/dashboard/demo` — same Prestige map as the admin page (Sarah ↔ Michael · Luxury Condo).

As **admin:** `/dashboard/admin/demo` — identical content + pointer to `/admin/demo` staging tools.

As **broker:** `/dashboard/broker/crm` — pipeline, notes, offers, contracts.

## 4. Scenario pages (happy path)

1. `/dashboard/admin/demo` — jump links (admin)
2. `/dashboard/broker/crm` — pipeline + recent interactions
3. `/dashboard/listings` — Luxury Condo Downtown ($750k)
4. `/dashboard/broker/offers` — offer inbox
5. `/dashboard/contracts` — signed + pending + partial
6. `/dashboard/messages` — David ↔ Michael thread (unread sample)
7. `/dashboard/appointments` — requested / confirmed / completed
8. `/dashboard/tasks` — action queue (mixed priorities)
9. `/dashboard/notifications` — mixed types
10. `/dashboard/deals` — shared deal (Michael / James / Sarah)
11. `/dashboard/broker/commissions` — paid + pending commission rows
12. `/tenant` — two workspaces for demo clients

## 5. Tenant switch test

Log in as `michael@client.demo` (or `emma@client.demo`) → open `/tenant` → confirm **Prestige** (and **Urban** for Emma) appear. Switch tenant in the app shell if available; CRM/listings should scope per tenant.

## 6. Role test

- **Broker:** CRM, offers, commissions, tasks—not admin routes.
- **Client:** offers (`/dashboard/offers`), intake, messages.
- **Admin:** `/dashboard/admin`, `/dashboard/admin/demo`, `/admin/demo` (staging tools).

## 7. Staging reset (optional)

If using staging demo reset API/UI:

1. Open `/admin/demo` (admin only, staging env).
2. Run reset (truncates / reseeds base data per your deployment).
3. Re-run **`DEMO_FULL_CLEAR=1 npm run demo:full`** to restore the **full** connected dataset (not part of cron reset).

See also: `docs/DEMO_RESET_AND_ANALYTICS.md`, `docs/STAGING_ENVIRONMENT.md`.

## 8. Safety

- Do not disable tenant scoping or auth for demos.
- Demo write protection and environment gates stay as implemented in code.
- Production must not use staging-only reset endpoints.

## 9. Final validation pass (Part 15)

Run through after seeding:

1. `/dashboard/demo` — all Prestige links work.
2. Broker `/dashboard/broker` — stats and commission snapshot show numbers (not placeholders).
3. CRM, listings, offers, contracts, messages, tasks, notifications, deals, commissions — non-empty.
4. Client login — offers + intake + messages.
5. Admin — `/dashboard/admin` charts/activity.
6. `/tenant` — expected memberships for demo clients.
7. Spot-check Prestige vs Urban brokers for tenant isolation.
