# Growth governance memory + enforcement feedback layer

## Purpose

Provide **advisory feedback** that helps operators understand:

- Which governance-style constraints recur (freeze, block, approval-required, review)
- Which patterns may be repeatedly useful (e.g. learning freeze during weak evidence)
- Which enforcement gates align with policy intent
- Where constraints **might** be overly conservative — **for human review only**

This layer **does not** change policy rules, unfreeze domains, relax approvals, or touch payments, bookings, ads execution, or CRO core.

## Input sources (v1)

The bundled builder (`buildGrowthGovernanceFeedbackFromSystem`) may consume, when feature flags allow:

- Governance decision (`evaluateGrowthGovernance`)
- Governance policy snapshot (`buildGrowthGovernancePolicySnapshot`)
- Policy enforcement snapshot (`buildGrowthPolicyEnforcementSnapshot`)
- Learning control (`getGrowthLearningReadOnlyForCadence`)
- Mission control human review queue depth (`buildGrowthMissionControlSummary`)
- Optional decision journal lines (placeholder: empty array until a journal API exists)

## Extraction logic

`extractGrowthGovernanceFeedbackEntries` emits **raw** candidate entries from the above signals. Patterns include:

- Policy rule modes mapped to categories (freeze, block, approval_required, advisory_only)
- Enforcement frozen/blocked/approval-required targets
- Governance status (freeze recommended, human review)
- Learning `freeze_recommended` with conservative usefulness heuristics
- A **narrow** over-conservative hint when governance is calm but strategy/sim promotion gates remain tight (flagged for review, not auto-relaxation)

## Usefulness vs over-conservative

- **Useful / unclear / insufficient_data / too_conservative** are assigned **conservatively**.
- **Over-conservative** entries require explicit signals (e.g. enforcement insight above) or merged recurrence — not automatic relaxation.

## Policy review queue

`buildGovernancePolicyReviewQueue` turns the summary into **human-only** suggestions (title, rationale, severity, recommendation). It does not write rules or call enforcement APIs.

## Safety guarantees

- No automatic policy changes, unfreeze, or execution enablement
- No source-system mutation
- Advisory summaries and insights only
- Source systems (governance, policy, enforcement) remain authoritative

## Feature flags

| Env | Purpose |
|-----|---------|
| `FEATURE_GROWTH_GOVERNANCE_FEEDBACK_V1` | Master gate: API + core feedback build |
| `FEATURE_GROWTH_GOVERNANCE_FEEDBACK_PANEL_V1` | Dashboard panel |
| `FEATURE_GROWTH_GOVERNANCE_FEEDBACK_BRIDGE_V1` | Optional 1–2 insight lines in Governance Console |

Default: **all off**.

## API

- `GET /api/growth/governance-feedback` — returns `{ summary, insights, reviewQueue }` when feedback v1 is on and the user passes Growth Machine auth.

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-governance-feedback*.test.ts
```
