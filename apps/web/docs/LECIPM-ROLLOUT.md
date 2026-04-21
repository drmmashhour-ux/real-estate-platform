# LECIPM phased rollout — dependency-aware delivery

This document defines **seven sequential phases** for shipping the institutional investment stack without breaking dependencies or front-loading complexity. Implement and validate **one phase at a time** before expanding scope.

---

## Principles

| Rule | Meaning |
|------|---------|
| **Incremental value** | Each phase is usable on its own with stable APIs. |
| **Strict build order** | Phase *N+1* is engineered after phase *N* is validated (team process); runtime env flags stay independent per layer. |
| **Production safety** | No silent failures: structured logs (`[lecipm-rollout]`), safe JSON when a phase is disabled, no stack traces leaked to clients. |
| **No churn** | Do not overwrite historical decisions, memos, or approvals; versions and audit trails stay authoritative. |

---

## Feature flags (env-backed, default **off**)

Enable only what you have validated. All use `true` or `1`.

| Env | Phase | Scope |
|-----|-------|--------|
| `FEATURE_ESG_V1` | 1 | ESG scoring, evidence posture, action center; acquisition screening (`/api/acquisition/screen`, `/api/investment/acquisition`). |
| `FEATURE_INVESTOR_V1` | 2 | Investor memo + IC pack APIs. |
| `FEATURE_DEALS_V1` | 3 | Deal pipeline + committee workflow (`/api/deals/pipeline/summary`, …). |
| `FEATURE_CAPITAL_V1` | 4 | Capital stack + lender workflow (`/api/capital/...`). |
| `FEATURE_CLOSING_V1` | 5 | Closing room + onboarding (`/api/closing/...`). |
| `FEATURE_PORTFOLIO_V1` | 6 | Portfolio intelligence (`/api/portfolio/intelligence`). |
| `FEATURE_EXECUTIVE_V1` | 7 | Multi-agent executive layer (`/api/agents/...`). |

**Exports:** `@/config/feature-flags` exposes `lecipmRolloutFlags`, `FEATURE_ESG_V1`, … `FEATURE_EXECUTIVE_V1`.

**Rollout helpers:** `@/lib/lecipm/rollout` — `isLecipmPhaseEnabled`, `lecipmRolloutDisabledMeta`, typed empty payloads for pipeline summaries when disabled.

### Existing environments

Until flags are set, gated routes return **200** with empty structures plus `rollout: { phase, enabled: false, flag, message }`. To preserve **parity with pre-rollout behavior**, enable all phases you already rely on in one deployment (or set them in `.env.local` for development).

---

## Phase overview

### Phase 1 — ESG + acquisition foundation

**Objective:** Core intelligence and screening.

**Canonical APIs**

- `GET /api/esg/profile?listingId=`
- `GET /api/esg/actions?listingId=` (alias surface for action center data)
- `POST /api/acquisition/screen` — stateless screening (`PASS` / `CONDITIONAL` / `FAIL` from underwriting stance)
- `POST /api/investment/acquisition` — persisted analysis run (requires phase 1 + auth)

**Acceptance:** Score + confidence visible; screening labels correct; action center reachable when authorized.

---

### Phase 2 — Investor outputs

**Objective:** Memo + IC pack from real inputs.

**APIs:** `GET /api/investor/memo/[listingId]`, `GET /api/investor/ic-pack/[listingId]`, generation routes under same tree.

---

### Phase 3 — Deal pipeline + committee

**Objective:** Stages, committee submission, conditions, diligence, audit.

**Representative gate:** `GET /api/deals/pipeline/summary`

---

### Phase 4 — Capital stack + lender workflow

**Representative gate:** `GET /api/capital/pipeline/summary`

---

### Phase 5 — Closing room + onboarding

**Representative gate:** `GET /api/closing/pipeline/summary`

---

### Phase 6 — Portfolio intelligence

**Representative gate:** `GET|POST /api/portfolio/intelligence`

---

### Phase 7 — Multi-agent executive layer

**Representative gate:** `POST /api/agents/execute`

Coordinates domain agents, tasks, approvals (see executive modules).

---

## Validation scripts

From `apps/web`, with the dev server running (`pnpm dev` uses port **3001** by default):

| Script | Command |
|--------|---------|
| Phase 1 | `pnpm exec tsx scripts/phase1-validation.ts` |
| Phase 2 | `pnpm exec tsx scripts/phase2-validation.ts` |
| … | … |
| Phase 7 | `pnpm exec tsx scripts/phase7-validation.ts` |
| All | `pnpm exec tsx scripts/phase-all-validation.ts` |

**Env:** `VALIDATION_BASE_URL` (or `LECIPM_PHASE_VALIDATION_URL`) overrides the default `http://127.0.0.1:3001`.

Scripts perform **anonymous HTTP smoke checks** (ready probe + expected 4xx on protected routes). Authenticated flows belong in Vitest/e2e or `validate:lecipm-system`.

---

## Testing matrix (per phase)

| Layer | API smoke | UI render | Missing data | Permissions | Logs |
|-------|-----------|-----------|--------------|-------------|------|
| 1–7 | Phase scripts | Manual / Playwright | Empty `rollout` payloads | 401/403 paths | `[lecipm-rollout]` |

---

## Rollback

- Toggle env flag **off** — APIs revert to safe empty payloads.
- Prefer additive migrations; avoid destructive schema changes without backfill plans.
- Version investor artifacts (memo, IC pack, PDFs) — never overwrite prior versions in place.

---

## Performance note

Prefer caching and incremental recompute (ESG profile, memos, portfolio health) keyed off **material changes** — do not recompute full stacks on every request. Implementation lives in respective modules; this rollout doc does not change compute policies.

---

## Role alignment

| Role | Primary surfaces |
|------|------------------|
| Broker | Deal pipeline, ESG, listings, clients |
| Investor | Memo, IC pack, portfolio |
| Admin | Monitoring, approvals |
| Executive AI | Supports all; **does not replace** human decisions on material actions |

---

## References

- `config/feature-flags.ts` — `lecipmRolloutFlags`
- `lib/lecipm/rollout.ts` — disabled payloads + logging
- `scripts/phase*-validation.ts` — smoke runners
