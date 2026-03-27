# Staging demo reset & analytics

## Daily auto-reset (Vercel Cron)

1. Set **`NEXT_PUBLIC_ENV=staging`** and **`CRON_SECRET`** on the staging project.
2. Add **`apps/web/vercel.json`** (included in repo) with cron `0 3 * * *` → `GET /api/cron/reset-demo`.
3. Vercel Cron sends a request with **`Authorization: Bearer <CRON_SECRET>`** — match the same value as env `CRON_SECRET`.

`resetDemoDatabase()` (see `lib/demo-reset.ts`):

- Throws unless **`NEXT_PUBLIC_ENV=staging`**.
- Truncates **all** public tables (except `_prisma_migrations`).
- Re-inserts users where **`role === ADMIN`** OR email is in **`DEMO_RESET_KEEP_EMAILS`** (default `demo@platform.com`).
- Runs **`runSeed()`** from `prisma/seed.ts` via `prisma/seed-runner.ts` for CLI.

Manual / CLI:

```bash
cd apps/web
NEXT_PUBLIC_ENV=staging npm run demo:reset
```

Admin UI: **Admin → Staging demo → Reset demo database now** (`POST /api/admin/demo/reset`, admin session).

## Demo analytics (`DemoEvent`)

- Model: **`DemoEvent`** (`demo_events` table).
- **`lib/demo-event-types.ts`** — `DemoEvents` (const) lists allowed event names; use these instead of raw strings.
- **`lib/demo-analytics.ts`** — `trackDemoEvent(event, metadata?, userId?)` only when **`NEXT_PUBLIC_ENV=staging`**.
- **Admin → Staging demo** shows aggregates via **`GET /api/admin/demo/analytics`** (admin-only): funnel, top listings, search terms, blocked routes, event counts.
- **Page views:** client **`DemoPageViewTracker`** → `POST /api/demo/track`.
- **Blocked actions:** middleware + `blockIfDemoWrite` record `blocked_action` with route, method, `reason: demo_mode`, and `userRole` (staging).
- **Guided demo:** `lib/demo-steps.ts`, `components/demo/DemoProvider.tsx` + `DemoOverlay.tsx` (staging). Events: `demo_step` (metadata `stepId`), `demo_completed`. First password/demo login sets a one-time autostart flag; users can skip anytime. AI tips: `POST /api/demo/ai-help`.

## Safety

- Reset **never** runs unless `NEXT_PUBLIC_ENV=staging` (throws).
- Analytics API is **admin-only**; do not expose publicly.
