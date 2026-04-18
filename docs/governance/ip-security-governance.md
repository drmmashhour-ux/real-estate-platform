# IP & Security Governance Dashboard (Command Center)

## What it shows

A **single read-only strip** on the **Market Intelligence Command Center** (`/admin/command-center`) summarizing:

- **Legal documentation presence** under `docs/legal/` (drafts and checklists).
- **IP posture signals** — checklist file presence and a **heuristic** that counts `app/api/**/route.ts` files (backend surface area), not a penetration test.
- **Security documentation signals** — mostly derived from checkbox completion in `docs/security/PROD-SECURITY-CHECKLIST.md` by section, plus supporting files (e.g. `pr-security-gates.md`, `ai-and-legal-safety.md`).
- **Production readiness** — optional score from checkbox completion in `docs/launch/LAUNCH-READINESS-REPORT.md`.
- **Risk classification** — `low` / `medium` / `high` from `computeGovernanceRisk()` (advisory).

This is **not** a legal opinion, **not** a security certification, and **not** automated compliance.

## How to interpret risk levels

| Level | Meaning (internal) |
|-------|-------------------|
| **low** | Core legal drafts appear present and PROD security checklist sections used for scoring look mostly complete (per heuristics). |
| **medium** | One or more gaps (missing drafts, incomplete checklist sections, or low launch-readiness ratio). |
| **high** | Multiple critical gaps (e.g. missing terms **and** privacy) or combined auth/Stripe signals failing heuristics. |

## What to fix first (operational)

1. Ensure **Terms** and **Privacy** drafts exist under `docs/legal/` and are reviewed by counsel before reliance.
2. Complete **PROD security checklist** sections relevant to your environment (Stripe, auth, DB TLS, API abuse).
3. For **Québec**, use `LAW25-PRIVACY-CHECKLIST.md` with qualified privacy counsel — the dashboard only checks **file presence**.
4. Improve **launch readiness** by working through `docs/launch/LAUNCH-READINESS-REPORT.md` checkboxes.

## Production readiness tie-in

If `LAUNCH-READINESS-REPORT.md` is readable, the dashboard shows a **ratio of checked vs unchecked** markdown boxes — **observational**, same limitations as other doc-derived metrics.

## API

`GET /api/admin/governance/ip-security` returns `{ snapshot, risk, alerts }` for authenticated admin sessions (read-only JSON).

## Limitations

- **No live telemetry** for incidents/alerts in the default snapshot (placeholders).
- **Deployment**: If the server cannot read the monorepo `docs/` tree (e.g. minimal deploy without docs), flags may read as **missing** even when policies exist elsewhere.
- **Trademark**: Always **manual_review_required** until you add a vetted data source.
- **Heuristic “core logic protected”**: API route file count — not a substitute for architecture review.

## Validation

```bash
cd apps/web && pnpm exec vitest run services/governance/ip-security-governance.service.test.ts services/governance/ip-security-risk.test.ts
```
