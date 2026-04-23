# Autonomous Brain Control Center

Operator-facing surface that sits **on top of** the existing learning, investment snapshot, and autonomy (marketplace optimization) engines. It does **not** replace those modules; it reads their persisted artifacts and exposes approval, prioritization, and outcome tracking with a **human-review-first** posture.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `modules/learning/learning-dashboard.service.ts` | Read-only queries over `LearningPattern`. |
| `modules/investment/investment-dashboard.service.ts` | Read-only queries over `InvestmentOpportunity` (+ pure formatters in `investment-opportunity-formatters.ts`). |
| `modules/marketplace/marketplace-optimization-approval.service.ts` | Thin governance wrapper around `AutonomyDecision`: approve / reject / implement (`applyDecision`) / expire. |
| `modules/autonomous-brain/autonomous-brain-priority.service.ts` | Cross-domain ranking for the priority queue. |
| `modules/autonomous-brain/autonomous-brain-outcomes.service.ts` | Compares `baselineMetricsJson` vs `outcomeMetricsJson` after apply. |
| `modules/autonomous-brain/autonomous-brain-audit.service.ts` | Writes `ManagerAiOverrideEvent` rows (`scope = autonomous_brain_control_center`). |
| `modules/autonomous-brain/autonomous-brain-summary.service.ts` | Aggregates dashboard + mobile payloads. |

### UI

- Admin page: `apps/web/app/dashboard/admin/autonomous-brain/page.tsx`
- Tables/queue: `components/learning/LearningPatternTable.tsx`, `components/investment/InvestmentOpportunityTable.tsx`, `components/marketplace/MarketplaceOptimizationQueue.tsx`

### APIs

| Method | Path | Guard |
| --- | --- | --- |
| GET | `/api/autonomous-brain/summary` | `requireAdminSession` |
| GET | `/api/autonomous-brain/patterns` | admin |
| GET | `/api/autonomous-brain/opportunities` | admin |
| GET | `/api/autonomous-brain/proposals` | admin |
| POST | `/api/autonomous-brain/proposals/[id]/approve` | admin |
| POST | `/api/autonomous-brain/proposals/[id]/reject` | admin |
| POST | `/api/autonomous-brain/proposals/[id]/implement` | admin |
| POST | `/api/autonomous-brain/proposals/[id]/expire` | admin |
| GET | `/api/mobile/admin/autonomous-brain/summary` | `requireMobileAdmin` |

Approval routes accept optional JSON body `{ "note": "..." }`.

## Operator workflow

1. Review **priority queue** (cross-domain ranking) — each item lists data sources, confidence, advisory-only flag, and why it surfaced.
2. Drill into **learning patterns** (sort/filter by confidence, impact, minimum sample size).
3. Inspect **investment opportunities** (risk + score filters; rationale JSON in drawer — advisory snapshots only).
4. Work the **marketplace optimization queue**: approve → optional implement; reject or expire with notes.
5. Monitor **outcome tracking** after implementation — metric deltas derive from autonomy baseline vs outcome snapshots (not a substitute for finance-grade revenue reporting).

## Prioritization logic

Priorities merge three domains:

- **Learning patterns** — product of `impactScore`, `confidence`, evidence (`sampleSize` scaled), and a small urgency bump for high confidence.
- **Investment opportunities** — normalized score, risk tier penalty, ROI presence.
- **Optimization proposals** — `impactEstimate` (fallback: confidence), approval friction, urgency for `PROPOSED` / `APPROVED`.

Each item carries explainability: **data sources**, **confidence**, **advisory-only**, and **prioritization factors**.

## Approval lifecycle

Underlying store: `autonomy_decisions.status` (VARCHAR). Operator UI statuses map as follows:

| UI | Raw autonomy status |
| --- | --- |
| PROPOSED | `PROPOSED` |
| APPROVED | `APPROVED` |
| REJECTED | `REJECTED` (also used for rolled-back / invalid rows for clarity) |
| IMPLEMENTED | `APPLIED`, `AUTO_APPLIED` |
| EXPIRED | `EXPIRED` |

Actions delegate to `approveDecision`, `rejectDecision`, `applyDecision`, and `markDecisionExpired` in `autonomy-decision.service.ts`. Human actions are mirrored into `ManagerAiOverrideEvent` via `logAutonomousBrainAudit`.

## Outcome tracking

For rows with `APPLIED` / `AUTO_APPLIED`, `autonomous-brain-outcomes.service.ts` compares baseline vs outcome metric snapshots (`BaselineMetrics` shape). Metrics labeled **conversion**, **close rate proxy**, **engagement** (lead score), **allocation quality** (demand index), and **revenue proxy** (lead volume) are **illustrative**; authoritative revenue remains in finance systems.

## Safety model

Additive extensions only: new services, routes, UI, optional notes on approve/reject, and `EXPIRED` as an additional autonomy status. Engines and apply/validate paths are reused, not rewritten.
