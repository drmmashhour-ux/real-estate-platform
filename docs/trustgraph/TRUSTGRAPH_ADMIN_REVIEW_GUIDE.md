# TrustGraph — admin review guide

## Access

- Requires platform **ADMIN** role (`User.role === ADMIN`).
- **Queue UI** requires `TRUSTGRAPH_ENABLED=true` and the admin queue sub-flag. **Note:** when the master flag is on, `TRUSTGRAPH_ADMIN_QUEUE_ENABLED` **defaults to enabled** unless explicitly set to `false` (`lib/trustgraph/feature-flags.ts`).
- `HubLayout` hides the TrustGraph nav item when `adminQueue` is false.

## Queue page (`/admin/trustgraph`)

- Lists recent `VerificationCase` rows: score, trust level, readiness, status, entity type/id, updated time.
- **API:** `GET /api/trustgraph/queue` — filters: `status`, `entityType`, `trustLevel`, `assignedTo`, `take` (admin-only).

## Case detail (`/admin/trustgraph/cases/[id]`)

1. **Score block** — `overallScore`, `trustLevel`, `readinessLevel`.
2. **Explanation** — May include templated or AI-assisted text; **always** correlate with **rule results** below (deterministic source of truth).
3. **Signals** — `VerificationSignal`: severity, `signalCode`, message, evidence JSON.
4. **Rule results** — `VerificationRuleResult`: `ruleCode`, `ruleVersion`, `passed`, `scoreDelta`.
5. **Next best actions** — `NextBestAction`: priority, title, description, `actionCode`.
6. **Human review log** — `HumanReviewAction` via relation **`reviewActions`** (reviewer email when joined).

### Quick actions (client)

- `TrustGraphCaseActions` → `POST /api/trustgraph/cases/[id]/actions` with `approve`, `reject`, `request_info`, `escalate`, etc.

### Extended actions (API)

- `override_score`, `dismiss_signal`, `assign` — see Zod schema in `app/api/trustgraph/cases/[id]/actions/route.ts`.

---

## Override policy

- Prefer actions that **append** `HumanReviewAction` and update case metadata over raw SQL.
- Do not delete historical `VerificationRuleResult` rows; a **new pipeline run** supersedes display state for that case.

---

## Exposure tiers

| Audience | Should see |
|----------|------------|
| **Public** | Trust badge / readiness label only (if product exposes them). |
| **Seller / broker** | Missing items and actions relevant to their role. |
| **Admin** | Full signals, scores, evidence JSON, review log, overrides. |

---

## When the queue is empty

- Enable `TRUSTGRAPH_ENABLED=true`, save an FSBO listing in Seller Hub, or run `npm run seed:trustgraph` from `apps/web` (requires a draft listing in DB).
