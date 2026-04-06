# LECIPM Manager — Final production deployment & live validation report

**Last updated:** 2026-04-06  
**Purpose:** Move from “ready to deploy” to **LIVE** with real payment confirmed on the **production URL**.

---

## Git deploy (bypass CLI rate limit)

| Action | Result |
|--------|--------|
| **Commit** | `6daf248` on `main` — Vercel Hobby-safe crons, `.vercel/` gitignore, **`docs/deployment/GIT_VERCEL_APP_DOMAIN.md`**, launch reports, root `package.json` deploy helpers. |
| **Push** | **`origin/main`** updated (`github.com/drmmashhour-ux/real-estate-platform`). |

**You must:** In Vercel, ensure this repo/branch is connected so the push **triggers a production build** (no CLI). Then complete **domain + env** steps in `docs/deployment/GIT_VERCEL_APP_DOMAIN.md`.

---

## Final decision

| | |
|--|--|
| **STATUS** | **BLOCKED** until `https://app.lecipm.com` returns **200** for `/`, `/listings`, and `/api/ready` after the Git deploy + domain mapping + env. |
| **Blockers** | (1) **Post-push HTTP check:** `app.lecipm.com/listings` still **503**; `/api/ready` **timed out** — project/domain/env likely not fully wired or deploy still building. (2) **Stripe checkout + webhook** on production **not executed** here. |
| **Resolved in repo** | CLI upload rate limit **bypassed** by **Git push**; Vercel **cron** config fixed for Hobby in `apps/web/vercel.json`. |

---

## Step 1 — Vercel deployment

### Project configuration (verified in repo)

| Setting | Value |
|---------|--------|
| Root Directory (dashboard) | **`apps/web`** |
| Install | `cd ../.. && pnpm install --frozen-lockfile` |
| Build | `cd ../.. && pnpm build:web` |
| Source | `apps/web/vercel.json` |

### Deploy attempt (CLI)

- **Linked project:** `drmmashhour-uxs-projects/web` (local `.vercel/` created; **ignored via repo `.gitignore`** entry for `.vercel/`).
- **First failure:** Hobby plan rejected **hourly** (`0 * * * *`) and **every-15-min** (`*/15 * * * *`) crons.
- **Fix applied (deploy blocker only):** `apps/web/vercel.json`
  - `/api/cron/auto-close-worker`: `0 * * * *` → **`0 2 * * *`** (daily 02:00 UTC).
  - `/api/cron/marketing-publish-due`: `*/15 * * * *` → **`45 4 * * *`** (daily 04:45 UTC).  
  **Note:** Cadence is reduced on Hobby; **Pro** can restore tighter schedules — see `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md`.
- **Second failure:** **`Too many requests — try again in 24 hours (api-upload-free)`** — deploy **aborted**; production URL from this CLI path **not** obtained.

### Production URL (to fill after successful deploy)

| Field | Value |
|-------|--------|
| **Production URL** | _Pending — run `cd apps/web && vercel deploy --prod --yes --archive=tgz` after rate limit resets, or use Git-connected Vercel project._ |
| **Deployment date/time** | _Pending_ |

---

## Step 2 — Production environment (Vercel dashboard)

### Status: **NOT VERIFIED** (deploy did not finish)

Set at least:

| Variable | Rule |
|----------|------|
| `NEXT_PUBLIC_APP_URL` | **HTTPS** canonical app origin — **not** `localhost` |
| `STRIPE_SECRET_KEY` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` for the **same** deployment URL |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only |
| `CRON_SECRET` | For secured cron/internal routes |
| `DATABASE_URL` | Pooled URL for serverless |

**Repo naming:** Prisma/web code uses `NEXT_PUBLIC_SUPABASE_*` (not bare `SUPABASE_URL` / `SUPABASE_ANON_KEY`) — match **code**, not only this checklist’s shorthand.

Local strict check (when simulating prod URLs): `pnpm env:check:strict`

---

## Step 3 — Production smoke test (HTTP checks performed)

Checks from this environment (no auth):

| URL | Result | Notes |
|-----|--------|--------|
| `https://lecipm.com/` | **200** (content returned) | Marketing-style homepage; **not** validated as this monorepo’s Next build. |
| `https://lecipm.com/api/ready` | **404** | Next `/api/ready` **not** present on this host. |
| `https://app.lecipm.com/api/ready` | **503** | Unavailable / not routed to healthy app. |
| `https://app.lecipm.com/listings` | **503** | Same. |

**Conclusion:** **Cannot** mark homepage + `/listings` + `/api/ready` green for **this** Next app until the **actual** Vercel/production hostname is known and returns **200** on `/api/ready`.

---

## Step 4 — Real Stripe payment (production)

### Status: **NOT RUN — BLOCKER**

Requires: working production Next URL, test/live keys, webhook endpoint, browser checkout. **Not executed.**

After deploy, run (against staging or prod with test keys) from repo:

```bash
cd apps/web && pnpm exec tsx scripts/validate-bnhub-stripe-e2e.ts
```

Point `NEXT_PUBLIC_APP_URL` and webhook URL at the **same** deployment.

---

## Step 5 — Stripe Connect

### Status: **NOT RUN**

Complete in Stripe Dashboard + test connected account; re-test destination charges when capabilities are active.

---

## Step 6 — Logs

### Status: **NOT RUN** (no successful deployment / no Vercel runtime selected)

---

## Step 7 — Basic user flow

### Status: **NOT RUN** on production Next app

---

## Step 8 — Repo / tooling changes (this run)

| Change | Reason |
|--------|--------|
| `apps/web/vercel.json` cron schedules | **Hobby-compatible** daily-only crons so deploy is not rejected. |
| `.gitignore` → `.vercel/` | Avoid committing local Vercel link metadata. |
| `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md` | Document Hobby vs Pro cron behavior. |

---

## Step 9 — When STATUS can become **LIVE**

All must be true:

1. **Deploy succeeds** (after rate limit or via Git integration / Pro).  
2. **Single canonical URL** returns **200** for `/`, `/listings` (or your public listings path), and **`/api/ready`**.  
3. **One BNHub booking** completed with **Stripe test card** on that URL; webhook fires; booking **CONFIRMED/PAID** in DB; no duplicate webhook side effects.  
4. **Vercel + Stripe** logs clean for that flow.  
5. Update this file: **production URL**, **deployment timestamp**, **Stripe + webhook result**, **Connect status**.

---

## Related

- **Git deploy + `app.lecipm.com` + env names:** `docs/deployment/GIT_VERCEL_APP_DOMAIN.md`
- Readiness (DB + scripted Stripe): `docs/LAUNCH-READINESS-REPORT.md`  
- Hub validation: `docs/HUB-VALIDATION-REPORT.md`  
- Env + Vercel detail: `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md`

---

**End of report**
