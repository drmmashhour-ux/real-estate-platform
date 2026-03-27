# Team onboarding (people & process)

First **1–2 weeks** for a new hire: environment, repo, and how we work. For **developer machine setup** only, see also **`onboarding.md`**.

---

## Day 0 — Before start

- [ ] Accounts: GitHub org, Slack, email, Vercel (viewer if eng), design tool, CRM (if ops/sales).  
- [ ] Add to **team channel** and **on-call / escalation** doc if applicable.  
- [ ] Schedule **30 min** intro with Founder + **buddy**.

---

## Day 1 — Setup

1. **Clone** the monorepo; run **`pnpm install`** (see **`onboarding.md`**).  
2. **Read** (in order, ~2h):  
   - **`team-structure.md`** + **`roles.md`** (your lane)  
   - **`team-workflow.md`** + **`git-workflow.md`**  
   - **`communication.md`**  
3. **Environment:** Copy `apps/web/.env.example` → `.env` (never commit secrets).  
4. **Run:** `pnpm dev` or role-specific script from root **`package.json`**.

---

## Repo structure (high level)

| Path | What lives there |
|------|------------------|
| `apps/web` | Main Next.js platform (BNHub / LECIPM) |
| `apps/admin` | Admin dashboard |
| `apps/mobile` | Mobile app |
| `packages/*` | Shared UI, config, types |
| `services/*` | Backend / AI services (as applicable) |
| `docs/*` | Product, ops, **this team system** |

More: **`monorepo.md`**.

---

## Git workflow (non-negotiable)

- Branch from **`develop`**: `feature/*`, `fix/*`, `growth/*` per **`tasks.md`**.  
- Open **PRs**; **CI must pass**; use **`pull_request_template`**.  
- **No** `node_modules`, build dirs, or secrets — hooks enforce this.  
- Releases: **`release-strategy.md`**.

---

## How to contribute

1. Pick a ticket from **This week** column; move to **In progress**.  
2. Small PRs; conventional commits (`feat:`, `fix:` — see **`team-workflow.md`**).  
3. Request review from **CODEOWNERS** area or buddy.  
4. After merge to **`develop`**, verify on **staging** if you touched user-facing behavior.

---

## Week 1 goals (by role)

| Role | Goal |
|------|------|
| Engineer | One merged PR (bugfix or small feature) |
| Designer | One shipped spec or staging iteration |
| Growth | One published asset + metric baseline |
| Ops/sales | CRM updated + 5 meaningful conversations logged |

---

## Check-in cadence

- **Daily:** Short EOD update per **`daily-execution.md`**.  
- **End week 1:** 30 min with manager — fit, blockers, adjust scope.

---

## Related

| Doc | Topic |
|-----|--------|
| **`onboarding.md`** | Install, env, run commands |
| **`tasks.md`** | Task naming |
| **`hiring.md`** | How they were evaluated |
