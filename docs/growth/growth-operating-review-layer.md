# Growth Operating Review Layer (v1)

## Purpose

The **Growth Operating Review** is a **read-only, advisory** weekly-style synthesis that groups signals into:

- what worked  
- what did not  
- what was blocked  
- what was deferred  
- what should change next week  

It does **not** execute actions, write to source systems, or override Stripe, bookings, checkout, pricing, ads execution, or CRO core logic. Humans remain in control; source panels and databases stay authoritative.

## Input sources

When `FEATURE_GROWTH_OPERATING_REVIEW_V1` is enabled, the aggregator may load (subject to each module’s own flags and safe partial failure):

| Source | Role |
|--------|------|
| Executive summary | Ads band, risks, lead snapshot |
| Daily brief | Today’s priorities, blockers |
| Strategy bundle | Weekly plan status, roadmap |
| Governance decision | Freeze / review / blocked domains |
| Simulation bundle | Scenario recommendations (e.g. defer) |
| Memory summary | Winning patterns, recurring blockers |
| Multi-agent coordination | Present for future enrichment |
| Policy enforcement snapshot | Blocked advisory targets |
| Learning control | Freeze-recommended state |
| Autopilot action statuses | Pending / approved / rejected counts |
| Follow-up queue metrics | Due-now and high-score backlog |

**Decision journal:** v1 passes an empty reflection list until a persisted journal is wired; governance feedback may supply lines in a later revision.

## Category definitions

| Category | Meaning |
|----------|---------|
| `worked` | Conservative positive signals (e.g. STRONG ads + hot leads, healthy governance, memory winning patterns) |
| `didnt_work` | Weak campaign band, weak strategy plan, recurring memory blockers, follow-up pressure |
| `blocked` | Governance review/freeze, enforcement blocks, learning freeze, many rejected autopilot rows |
| `deferred` | Simulation `defer`, low-priority roadmap themes, overloaded daily priorities |
| `change_next_week` | Bounded suggestions only — not tickets or auto-tasks |

## Status logic

Status (`weak` \| `watch` \| `healthy` \| `strong`) is computed deterministically from **counts** of items in each bucket plus whether next-week suggestions exist. It favors **watch** when evidence is mixed or incomplete. See `deriveGrowthOperatingReviewStatus` in `growth-operating-review.service.ts`.

## Next-week change logic

Suggestions are capped (max **5**), ordered by a fixed priority list, and derived only from read-only inputs. See `growth-operating-review-next-week.service.ts`.

## Safety guarantees

- Additive-only surface; no deletes of existing growth code paths  
- No automatic execution  
- Bounded outputs per category  
- Safe with partial data (`missingDataWarnings` in build input and notes)  
- Monitoring logs `[growth:operating-review]` and never throws from telemetry  

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_GROWTH_OPERATING_REVIEW_V1` | Enables `buildGrowthOperatingReviewSummary()` and `GET /api/growth/operating-review` |
| `FEATURE_GROWTH_OPERATING_REVIEW_PANEL_V1` | Shows the dashboard panel (panel still needs review v1 for API data) |

Defaults: **off**.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-operating-review
```

Optional: `pnpm run typecheck` in `apps/web` when the workspace has enough heap for full `tsc`.

## API

- `GET /api/growth/operating-review` — returns `{ summary }` when review v1 is on and the user passes Growth Machine auth (same pattern as other growth JSON routes).

---

**OPERATING REVIEW LAYER ADDED — NO CORE GROWTH SYSTEM MODIFIED** (additive files and wiring only; existing engines unchanged.)
