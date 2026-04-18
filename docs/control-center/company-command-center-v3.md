# Company Command Center V3

## Purpose

**Company Command Center V3** is a **role-based presentation layer** on top of the same read-only aggregates as **V1** (AI Control Center) and **V2** (tabbed company command center). It does **not** replace V1 or V2, does not execute actions, and does not toggle flags.

## Enablement

| Env | Code |
|-----|------|
| `FEATURE_COMPANY_COMMAND_CENTER_V3=true` | `controlCenterFlags.companyCommandCenterV3` |

When **off**, the admin route returns **404** and `GET /api/admin/control-center-v3` returns **404**.

## Roles and intended users

| Role | Query `role=` | Audience |
|------|----------------|----------|
| **Founder** | `founder` (default) | Executive summary, opportunities, risks, rollouts |
| **Growth** | `growth` | Ads, CRO, ranking, growth loop emphasis |
| **Operations** | `operations` | Operator, platform core, swarm coordination |
| **Risk / Governance** | `risk_governance` | Rollback signals, fallback, conflicts, blocked rollouts |

URL: `?role=founder|growth|operations|risk_governance`

## Differences from V2

- **V2** organizes by **subsystem tabs** (Executive, Growth, Ranking, …).
- **V3** organizes by **decision-maker role** — same underlying `loadCompanyCommandCenterV2Payload` → V1 aggregate, with **heuristic role mappers** for priorities, risks, and wording.

## Data sources

- **`loadCompanyCommandCenterV3Payload`** calls **`loadCompanyCommandCenterV2Payload`** once, then maps into four `CommandCenterRoleView` objects.
- Optional API query **`role`** narrows the JSON: non-selected roles return **empty placeholder views** (same keys, minimal content) to keep a stable shape.

## Status meanings

Role-level attention uses shared unified statuses from V1 (`healthy`, `limited`, `warning`, `critical`, `disabled`, `unavailable`). V3 does not invent health scores.

## Limitations

- Heuristic copy only — not a substitute for subsystem detail pages.
- When the V2 aggregate fails entirely, `shared.systems` may be **null** and UIs show a partial-load banner.
- Focused-role responses empty out non-selected roles by design (bandwidth optimization).

## Validation

```bash
pnpm exec vitest run modules/control-center-v3/ app/api/admin/control-center-v3/route.test.ts
```

## Relationship to V1 and V2

**V1** and **V2** remain unchanged in purpose and routes. **V3** is additive UX for role-based scanning.
