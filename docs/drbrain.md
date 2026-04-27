# DR.BRAIN — platform guardian

DR.BRAIN (`@repo/drbrain`) runs **read-only configuration and connectivity checks** per app:

- **LECIPM** (`apps/web`, id `lecipm`)
- **Syria / Darlink** (`apps/syria`, id `syria`)
- **HadiaLink** (`apps/hadialink`, id `hadialink`) — skipped in CLI until `DATABASE_URL` is configured for that workspace

## What it checks

- **Environment isolation** via `@repo/db` `assertEnvSafety` (no raw `DATABASE_URL` in logs — only redacted hints on failure).
- **Database connectivity** via each app’s own `test-db` script (CLI) or Prisma `$queryRaw` in admin pages — **no shared Prisma client across apps**.
- **Security / NODE_ENV** hints.
- **Payments posture** for Syria (`SYBNB_*`, escrow, kill switches, Stripe webhook presence — **never calls PSP APIs**).
- **Optional anomalies** (Syria): aggregates from existing monitoring helpers — **no secrets**.
- **Optional** `pnpm exec tsc --noEmit` per app when `DRBRAIN_INCLUDE_BUILD=true`.

## Run locally

```bash
pnpm install
pnpm drbrain:check
```

Environment files are merged **per app directory** (`apps/web/.env`, `apps/syria/.env`, …). Process env is copied first; app files override — **still never printed**.

## Alerts

`sendDrBrainAlert`:

- Always emits a safe **`console.warn`** line with prefix `[DR.BRAIN][LECIPM]` / `[DR.BRAIN][SYRIA]` / `[DR.BRAIN][HADIALINK]`.
- If `DRBRAIN_ALERTS_ENABLED=true`, optionally POSTs JSON to `DRBRAIN_SLACK_WEBHOOK_URL`.
- Email providers are placeholders (`DRBRAIN_EMAIL_PROVIDER=console` default).

## Optional runtime kill-switch (Syria only)

If **`DRBRAIN_RUNTIME_KILL_SWITCH_AUTO=true`** **and** a **payments.\*** check is **CRITICAL**, DR.BRAIN sets **process-only**:

- `SYBNB_PAYMENTS_KILL_SWITCH=true`
- `SYBNB_PAYOUTS_KILL_SWITCH=true`

Nothing is persisted to disk or DB.

## What DR.BRAIN never does

- Mix databases between apps or import another app’s code.
- Log secrets (`DATABASE_URL`, API keys, webhook secrets).
- Auto-enable payments or mutate production data.
- Replace human approval for risky changes.

## Admin UI

- **LECIPM:** `/[locale]/[country]/admin/dr-brain` (requires existing admin guard).
- **Syria:** `/[locale]/admin/dr-brain` (admin layout).
