# Company Command Center V6

## Purpose

V6 is an **additive** executive governance surface: four presentation modes (Weekly Board Pack, Due Diligence, Launch War Room, Audit Trail) built on top of the **V4 aggregate** and optional **V1 AI Control Center history**. It is **read-only** for operational systems: no execution, no feature-flag toggles, no mutation of AI or platform state.

**V1 / V2 / V3 / V4 / V5 remain unchanged** and are not replaced by V6.

## Modes

| Mode | Intended use |
|------|----------------|
| `weekly_board_pack` | Compact weekly scan for boards: wins/risks from window deltas, rollout lines, KPI echo, health counts. |
| `due_diligence` | Evidence-style signals from the governance snapshot (maturity, governance posture, known risk flags). |
| `launch_war_room` | Launch readiness heuristics, blockers, go/caution/hold labels, checklist — from V4 + V5 readiness helpers. |
| `audit_trail` | Traceability list: optional V1 history rows + V4 anomaly digest + window delta rows; grouped by system and severity. |

## Differences from V5

- **V5** focuses on operational “modes” (morning brief, incident, launch, investor) over the same V4 base.
- **V6** focuses on **governance and traceability** framing (board, diligence, war room, audit) without altering V5 routes or payloads.

## Data sources

- **Primary:** `loadCompanyCommandCenterV4Payload` (shared systems, deltas, digest, briefing cards, meta).
- **Optional:** `loadAiControlCenterPayload` → `history` for audit/diligence context when available.
- **Synthesis only:** mode mappers; no writes.

## Severity, readiness, traceability

- **Audit severity** maps digest severities via `control-center-v6-severity-mapper` (no inflation of weak signals).
- **Launch readiness** uses `deriveLaunchReadiness` from V5 (heuristic from overall status + blocked rollouts).
- **Traceability notes** in audit mode explain that sparse V1 history means reliance on digest/delta only.

## Limitations

- Partial or missing upstream sources appear in `meta.missingSources`; views should be interpreted as **best-effort**.
- Historical depth depends on V1 history and configured windows; **no fabricated trends**.
- When the `mode` query is used on the **API**, non-selected modes are returned as **empty shells** to reduce payload size for lightweight clients. The **admin page** calls the API **without** `mode` so all four modes stay populated while the URL `mode` only drives the visible tab (`useCompanyCommandCenterV6` supports optional `apiMode` if a narrow fetch is needed).

## Feature flag

- **Env:** `FEATURE_COMPANY_COMMAND_CENTER_V6`
- **Code:** `controlCenterFlags.companyCommandCenterV6`
- **Default:** off → admin page `notFound`, API `404`.

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/control-center-v6 app/api/admin/control-center-v6
```

Optional typecheck (monorepo root may vary):

```bash
pnpm exec tsc -p apps/web --noEmit
```
