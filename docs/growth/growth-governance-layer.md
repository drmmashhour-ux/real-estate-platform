# Growth Governance Layer (expanded spec, advisory V1)

## Purpose

Growth Governance is an **advisory** layer that classifies growth posture using deterministic rules:

| Status | Meaning (advisory) |
|--------|-------------------|
| `healthy` | Stable signals and manageable backlog |
| `watch` | No early leads today while campaigns exist, or similar drift |
| `caution` | Underperforming campaigns, concentration risk, or follow-up pressure |
| `freeze_recommended` | Weak/conflicting scaling signals — hold advisory expansion narratives |
| `human_review_required` | Blocked autopilot patterns, large due-now backlog, or fusion telemetry stress |

It does **not**:

- Change Stripe, bookings, checkout, or pricing
- Change ads execution, CRO engines, or ranking
- Auto-execute actions or toggle feature flags
- Persist governance state to the database (this phase)

Source systems remain authoritative; approvals and execution policies still gate real work.

## Types (`growth-governance.types.ts`)

- **`GrowthGovernanceStatus`** — five states above.
- **`GrowthGovernanceDomain`** — `leads` \| `ads` \| `cro` \| `content` \| `autopilot` \| `fusion`.
- **`GrowthGovernanceSignal`** — `id`, `category`, `severity`, `title`, `description`, `reason` (structured top risks).
- **`GrowthGovernanceDecision`** — `status`, `topRisks`, `blockedDomains`, `frozenDomains`, `humanReviewItems` (string lines), **`humanReviewQueue`** (structured `GrowthHumanReviewItem[]` when escalation is on), `notes`, `createdAt`.
- **`GrowthGovernanceFreezeState`** — `frozenDomains`, `blockedDomains`, `rationale[]` (from `getGrowthFreezeState` — labels only).
- **`GrowthHumanReviewItem`** — `id`, `title`, `reason`, `category`, `severity`.
- **`GrowthGovernanceContext`** — internal read-only inputs for escalation (includes `followUpHighIntentQueued`, **`followUpDueNowCount`**, autopilot counts, fusion hints, etc.).

## Architecture

```
evaluateGrowthGovernance()
  → read-only signals (UTM early leads, autopilot approval states, follow-up queue incl. due_now, optional fusion)
  → deterministic rules → GrowthGovernanceDecision
  → getGrowthFreezeState(decision) — advisory domain labels + rationale
  → buildGrowthHumanReviewQueue(decision, context) when escalation flag on
  → optional [growth:governance] monitoring (when monitoring flag on)
```

## Rule examples (non-exhaustive)

| Condition | Typical outcome |
|-----------|-------------------|
| Attributed campaigns exist, no early-conversion leads today, some history | `watch` + ads signal |
| Repeated campaign underperformance (insights) | `caution` / risk signals |
| Many rejected autopilot actions | `human_review_required`; `autopilot` in **blockedDomains** |
| High-intent follow-up backlog or **due_now** pile-up | `human_review_required` |
| Weak paid funnel + volume, or fusion warnings / weak fusion + weak ads | `freeze_recommended` |
| Stable benign signals | `healthy` |

**Blocked domains** are set from concrete signals; **`human_review_required`** always includes **`autopilot`** in blocked domains (advisory promotion surfaces). **`freeze_recommended`** extends blocked domains with **`ads`**, **`cro`**, **`content`**, **`fusion`** for scaling-narrative gating (still not a runtime kill switch).

## Frozen vs blocked

- **`blockedDomains`** on the decision — domains deprioritized for suggested automation / promotion until review.
- **`frozenDomains`** on the decision — aligned with **`getGrowthFreezeState`**: light hold (`watch` / `caution`) may freeze **`ads`** only; strong hold (`freeze_recommended` / `human_review_required`) freezes **`ads`**, **`cro`**, **`content`**, **`fusion`**, **`autopilot`** with explicit **rationale** lines.

## Human review escalation

`buildGrowthHumanReviewQueue(...)` returns **`GrowthHumanReviewItem[]`** when `FEATURE_GROWTH_GOVERNANCE_ESCALATION_V1` is on; otherwise `[]`. Items merge high-severity risks, context-driven backlog (including due-now pressure), fusion telemetry gaps, etc.; **deduped** and **capped**. `humanReviewItems` remains one-line strings for simple consumers.

## API (`GET /api/growth/governance`)

Backward-compatible JSON:

- `decision` — full `GrowthGovernanceDecision`
- `freeze` — legacy alias of freeze state
- **`freezeState`** — same as `freeze` (preferred name)
- **`humanReviewQueue`** — duplicate of `decision.humanReviewQueue` for consumers that read a top-level key

## Monitoring (`FEATURE_GROWTH_GOVERNANCE_MONITORING_V1`)

- `getGrowthGovernanceMonitoringSnapshot()` — evaluations, per-status counts, `repeatedEscalationCount`, `missingSignalWarnings`, etc.
- Logs prefixed with **`[growth:governance]`** (`evaluation started` / `evaluation completed` + structured JSON line). Never throws.

## Safety guarantees

- Advisory only; no schema migrations required for governance
- Bounded outputs (status + capped lists)
- Reversible: disabling flags removes governance UI and API behavior

## Feature flags

| Env | Default | When off |
|-----|---------|----------|
| `FEATURE_GROWTH_GOVERNANCE_V1` | off | `evaluateGrowthGovernance()` returns `null`; API 403 |
| `FEATURE_GROWTH_GOVERNANCE_ESCALATION_V1` | off | `buildGrowthHumanReviewQueue` returns `[]`; string fallbacks only where implemented |
| `FEATURE_GROWTH_GOVERNANCE_MONITORING_V1` | off | No counter bumps / `[growth:governance]` logs from monitoring hooks |

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-governance.service.test.ts
pnpm exec vitest run modules/growth/__tests__/growth-governance-freeze.service.test.ts
pnpm exec vitest run modules/growth/__tests__/growth-governance-escalation.service.test.ts
pnpm exec vitest run modules/growth/__tests__/growth-governance-monitoring.service.test.ts
```

Governance **recommends** posture; it does **not** change production behavior in this phase.
