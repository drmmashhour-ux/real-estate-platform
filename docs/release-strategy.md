# Production release strategy (BNHub / LECIPM)

Safe deployments, staging before production, rollback, and hotfixes. Complements **`docs/team-workflow.md`**, **`docs/cicd.md`**, and **`docs/onboarding.md`**.

---

## 1. Environments

| Environment | Where | Purpose |
|---------------|--------|---------|
| **Development** | Local machine (`pnpm dev`) | Day-to-day coding; `feature/*` branches. |
| **Staging** | Hosted pre-production (Vercel + staging Supabase / DB) | Integration testing, demos, QA — **mirrors prod behavior without live users**. |
| **Production** | Hosted live (`main`) | Real users; changes only through controlled releases. |

---

## 2. Branch mapping

| Branch | Environment |
|--------|-------------|
| **`feature/*`** (and **`fix/*`**) | Development (local + optional PR previews). |
| **`develop`** | **Staging** — deploy target for integrated code before production. |
| **`main`** | **Production** — deploy only after staging validation and release PR. |

---

## 3. Staging deployment

### Goals

- Deploy **`apps/web`** and **`apps/admin`** from **`develop`**.
- Use a **staging database** (separate Supabase project, or isolated schema — pick one approach and keep it consistent).
- Use **staging-only** Vercel env vars (never reuse production `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`).

### Recommended: Vercel (two projects or two “production” targets)

**Option A — Two Vercel projects (simplest mentally)**

| Vercel project | Git production branch | Role |
|----------------|------------------------|------|
| `bnhub-web-staging` | **`develop`** | Staging web |
| `bnhub-admin-staging` | **`develop`** | Staging admin |
| `bnhub-web` | **`main`** | Production web |
| `bnhub-admin` | **`main`** | Production admin |

Use the [Vercel GitHub integration](https://vercel.com/docs/deployments/git/vercel-for-git): each project gets its own **Production** and **Preview** env var sets. Set **staging Supabase** URLs/keys only on the staging projects.

**Option B — Optional CLI workflow**

If **`ENABLE_VERCEL_CLI_DEPLOY`** is `true`, see **`.github/workflows/deploy-vercel.yml`**. With **`ENABLE_VERCEL_STAGING`** = `true` and staging project secrets set, pushes to **`develop`** deploy web + admin to the **staging** Vercel projects (`vercel deploy --prod` there — “prod” means the default URL **of that staging project**, not public production).

### Database

- **Preferred:** separate Supabase **project** for staging (clean isolation).
- **Alternative:** one project with strict RLS and separate schema — higher risk of mistakes; document if you use it.

---

## 4. Production deployment

Production deploy **only** when:

1. Code is merged into **`main`** (via release PR from **`develop`**, or **`hotfix/*`** per below).
2. **CI passes** on that merge (lint + `build:ci` — see **`.github/workflows/ci.yml`**).
3. **Vercel** (Git integration or CLI) builds successfully with **production** env vars.

**Deploy:** **`apps/web`** and **`apps/admin`** (root directories in their Vercel projects).

Enforce in GitHub: **branch protection on `main`** — require **CI** status and PR review before merge (see **`docs/team-workflow.md`**).

---

## 5. Environment variables

| Rule | Detail |
|------|--------|
| **Separate staging vs production** | Different Vercel projects or at minimum different **Environment** tabs (Production vs Preview); never point staging at prod DB. |
| **No shared secrets** | Different `DATABASE_URL`, service role keys, Stripe keys (use Stripe test mode in staging). |
| **Source of truth** | Vercel dashboard + team secret manager — **not** the git repo. |
| **Templates only in git** | `apps/web/.env.example`, root `.env.example` — no real values. |

Copy variable **names** from examples; set **values** per environment in Vercel.

---

## 6. Standard release flow

1. Create **`feature/*`** from **`develop`**.
2. Implement; open **PR → `develop`**; CI green; review; merge.
3. **`develop`** deploys to **staging** (Vercel); run QA on staging URL.
4. When ready, open **release PR: `develop` → `main`** (clear title, e.g. `Release: 2025-03-28`).
5. After approvals + green CI, merge to **`main`** → **production** deploy.
6. Monitor (see §10).

---

## 7. Pre-release checklist (before merging to `main`)

Use in the release PR description or team runbook.

- [ ] **CI / build** passes on the release PR.
- [ ] **No new console errors** in primary flows on **staging**.
- [ ] **Critical flows** smoke-tested on **staging**:
  - [ ] Signup / login
  - [ ] Booking (guest path)
  - [ ] Payments (test mode)
  - [ ] Representative **admin** actions you ship in this release

---

## 8. Rollback

### Vercel (fastest)

1. Open the project (**Web** or **Admin**) in Vercel → **Deployments**.
2. Find the **last known good** deployment → **⋯** → **Promote to Production** (instant rollback to that build).

No git change required for infra rollback; your **`main`** branch may still point at newer code until you fix forward.

### Git (fix-forward or revert)

1. **`git revert`** the merge commit on **`main`** (preferred for shared teams — preserves history), push, let Vercel redeploy.
2. Or **hotfix** branch from **`main`**, patch, PR, merge.

Document **which app** was rolled back (web vs admin) if only one failed.

---

## 9. Feature flags (recommended)

The codebase already uses **env-driven and domain feature flags** (e.g. Trust Graph, growth automation). Pattern:

- **Short-term / risky features:** gate with `NEXT_PUBLIC_*` or server-only env flags in Vercel (**staging on first**, then **production**).
- **Long-term / ops toggles:** use your existing DB-backed **`FeatureFlag`** model where applicable (admin-controlled).

Ship dark features **off in production** until staging sign-off, then enable via env or flag **without** a new deploy when possible.

---

## 10. Monitoring (basic)

| Signal | Where |
|--------|--------|
| **Deployment status** | Vercel deployment list + GitHub Actions **CI** / optional **Deploy** workflow |
| **Errors after deploy** | Vercel **Runtime Logs**; app error reporting (e.g. Sentry) if configured |
| **Performance** | Vercel **Speed Insights** / **Analytics** if enabled; browser DevTools on staging before prod |

Set a **15–30 min** watch after production deploy for error spikes.

---

## 11. Hotfix flow

For **urgent production** issues:

1. Branch **`hotfix/short-description`** from **`main`** (production state).
2. Fix minimal change; PR → **`main`**; fast review; merge when CI green.
3. Confirm **production** deploy healthy.
4. **Merge `main` back into `develop`** (or open PR) so staging does not diverge.

Optional: use **Vercel rollback** first to restore service, then land the hotfix.

---

## 12. Validation checklist (team)

| Check | How |
|-------|-----|
| Staging deploy | Merge a small change to **`develop`**; confirm staging URLs update. |
| Production deploy | Merge to **`main`** after protection + CI; confirm prod URLs. |
| Rollback | In Vercel, promote previous deployment; confirm prod behavior. |
| Env vars | Staging uses staging DB/keys; production uses prod — spot-check in dashboard. |

---

## 13. Readiness summary

| Capability | Status |
|------------|--------|
| **Environments defined** | Development / staging / production (this doc). |
| **Deploy flow** | **Works** when Vercel Git projects (recommended) or optional CLI workflow + secrets are configured. |
| **Rollback** | **Ready** via Vercel **Promote to Production**; git **revert** as backup. |
| **CD** | Continuous **integration** on every PR; continuous **delivery** to staging on **`develop`** and to production on **`main`** when Vercel is wired as above. |

**You still must:** create staging Vercel projects (or staging env), configure Supabase (or DB) for staging, and set branch protection on **`main`**.
