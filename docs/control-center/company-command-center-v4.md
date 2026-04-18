# Company Command Center V4

## Purpose

**Company Command Center V4** adds an **executive briefing layer** on top of **V3** (and thus V2/V1 aggregates):

- **Daily briefing cards** (concise, severity-bounded)
- **Anomaly digest** (unified warning-style items)
- **What changed vs prior window** (numeric/string deltas where data exists)
- **Built-in role presets** (presentation-only)

It does **not** replace V1, V2, or V3, does not execute actions, and does not toggle feature flags.

## Difference from V3

- **V3** = role-mapped narrative panels.
- **V4** = same underlying `loadCompanyCommandCenterV3Payload` output, plus **two time windows** (current vs `offsetDays + previousOffsetDays`), briefing/digest/delta **derivation**, and optional **preset** metadata.

## Enablement

| Env | Code |
|-----|------|
| `FEATURE_COMPANY_COMMAND_CENTER_V4=true` | `controlCenterFlags.companyCommandCenterV4` |

When **off**, the admin route returns **404** and `GET /api/admin/control-center-v4` returns **404**.

## Role presets

Built-in presets (no custom persistence yet):

| ID | Name | Role |
|----|------|------|
| `founder_daily` | Founder Daily | founder |
| `growth_focus` | Growth Focus | growth |
| `operations_watch` | Operations Watch | operations |
| `risk_review` | Risk Review | risk_governance |

Custom save/update/delete is **deferred** — `company-command-center-presets.service.ts` exposes stub CRUD returning `not_persisted`.

## Daily briefing cards

Generated in `briefing/company-command-center-briefing.service.ts` from **real fields** on current/previous snapshots (e.g. fallback %, risky run %, overdue counts, fusion conflicts, ranking score). Max **8** cards. Severities: `info` | `watch` | `warning` | `critical`.

## Anomaly digest

Aggregated in `digest/company-command-center-anomaly-digest.service.ts` from the **current** snapshot only (ads anomaly text, CRO warnings, ranking rollback flag, brain warnings, platform overdue/blocked, swarm conflicts, fusion conflicts, etc.). Counts by severity are included.

## Changes since prior window

`deltas/company-command-center-delta.service.ts` compares **current** vs **previous** V3 payloads (same `days`/`limit`, different `offsetDays`). If either side lacks `shared.systems`, **`insufficientBaseline`** is set and narratives are conservative.

**Default:** `previousOffsetDays=1` (prior window one step back from `offsetDays`).

## Limitations

- “Yesterday” is **window-relative** (aggregate `offsetDays`), not wall-clock midnight UTC, unless upstream sources interpret that way.
- Missing numeric baselines → **no invented deltas**.
- Two sequential V3 loads per request — acceptable for admin-only; not for hot paths.

## Validation

```bash
pnpm exec vitest run modules/control-center-v4/ app/api/admin/control-center-v4/route.test.ts
```

## Relationship to V1–V3

**V1**, **V2**, and **V3** remain intact. **V4** is a **presentation and governance enhancement** only.
