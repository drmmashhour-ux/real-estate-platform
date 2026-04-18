# Company Command Center V5

## Purpose

**Company Command Center V5** adds **operational modes** on top of the **V4** aggregate (briefing + digest + deltas):

- **Morning Brief** — daily scan: changes, opportunities, risks, focus
- **Incident** — triage: severity, affected systems, rollback hints, stability fields
- **Launch** — rollout governance: readiness, checklist, rollout quadrants, go/caution/hold notes
- **Investor** — business-facing narrative **grounded in reported subsystem fields** only

No actions execute; no flags toggle; V1–V4 remain intact.

## Difference from V4

V4 produces briefing cards, anomaly digest, and window deltas. **V5** reuses that payload via `loadCompanyCommandCenterV4Payload` and **re-slices** it into the four modes above.

## Enablement

| Env | Code |
|-----|------|
| `FEATURE_COMPANY_COMMAND_CENTER_V5=true` | `controlCenterFlags.companyCommandCenterV5` |

When **off**, admin page **404** and `GET /api/admin/control-center-v5` **404**.

## Modes

| Mode | URL `mode=` |
|------|-------------|
| Morning Brief | `morning_brief` (default) |
| Incident | `incident` |
| Launch | `launch` |
| Investor | `investor` |

Optional **`mode`** query narrows the JSON: non-selected modes receive **placeholder empty shells** (stable keys).

## Severity / readiness

- **Incident severity** combines executive posture with digest severity (conservative blend).
- **Launch readiness** `go` | `caution` | `hold` from executive status + blocked rollouts + ranking rollback flag in checklist (see `control-center-v5-readiness-mapper.ts`).

## Data sources

- **V4** (two V3 windows, briefing, digest, deltas) → **V5** mode mappers.
- Missing `shared.systems` degrades mode content; partial data flags pass through.

## Limitations

- Narratives are **heuristic** and **source-bound**; investor copy must not claim revenue or market outcomes not in aggregates.
- Two **V4** loads per request (each V4 already does two V3 loads) — admin-only.

## Validation

```bash
pnpm exec vitest run modules/control-center-v5/ app/api/admin/control-center-v5/route.test.ts
```

## Relationship to V1–V4

Prior control centers are **unchanged**. V5 is a **presentation / governance** layer only.
