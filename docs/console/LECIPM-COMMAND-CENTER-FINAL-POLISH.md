# LECIPM Command Center — Final Polish

## Purpose

`/dashboard/lecipm` is the **unified LECIPM Command Center**: a production-grade executive surface that surfaces pipeline, trust, growth, and approvals without replacing underlying workflows.

## Layout structure (information architecture)

| Zone | Content |
|------|---------|
| **Executive summary** | Pipeline value, active deals, booked visits, conversion (30d), operational trust, automation posture — each tiles to a deeper route. |
| **Quick actions** | Role-aware chips (broker vs executive). |
| **Revenue + growth** | Narrative + links to Growth Machine / Marketing AI. |
| **Deals + pipeline** | Priority deals + stalled momentum (compact lists). |
| **Leads + conversion** | Hot/recent vs follow-up-needed. |
| **Trust + risk** | Trust score/band, dispute snapshot, open disputes count, remediation links. |
| **Marketing + expansion** | *(ADMIN only)* scheduling hint, campaigns, expansion, next move, deep links. |
| **Approvals + alerts** | CEO adjustments, trust spikes, high-priority disputes — quick view + open. |
| **Live activity** | Right rail (desktop): merged feed from deals, leads, trust, disputes, visits, autopilot (time-ordered). |
| **Mobile glance** | Collapsed KPI strip under feed on small screens. |

## Design rules

- **Background**: `#000` / near-black gradients on cards.
- **Accent**: `#D4AF37` — sparingly for metrics, borders-on-hover, and primary CTAs.
- **Typography**: Serif headlines (`font-serif`), neutral-400/500 body, white primary metrics (`tabular-nums` where numeric).
- **Cards**: `rounded-2xl`, subtle border `#1f1f1f`, soft shadow; hover lifts gold border ~25% opacity.
- **Status system** (shared `CcStatusBadge`):
  - **healthy** → green lane (on track)
  - **attention** → gold lane (watch / in progress)
  - **urgent** → red lane (blocked / urgent)
  - **inactive** → gray (quiet / insufficient data)
- **Motion**: Minimal; drawer slide-over for quick orientation (not a full workspace replacement).

## Navigation

- **Command Center Sidebar** (`CommandCenterSidebar`): grouped sections — Command, Operations, Growth & capital, Executive intel (ADMIN), Workspace.
- **Active route**: pathname tail match for gold active chip.
- **Classic escape**: “Back to Classic” persists preference (see dashboard migration doc).

## Role behavior

| Role | Behavior |
|------|----------|
| **ADMIN** | Full executive layout including Marketing + Expansion and admin quick actions / intel links. |
| **BROKER** (and other non-admin) | Broker command center: marketing section hidden; quick actions favor broker routes (trust, calendar, leads); feeds/alerts scoped to the user where possible. |

Implementation: `visibleSectionsForRole` + `isExecutiveCommandCenter` in `modules/command-center/`.

## Data layer

| Module | Responsibility |
|--------|----------------|
| `command-center-page.service.ts` | Bundles summary + feed + alerts. |
| `command-center-summary.service.ts` | KPIs, deal/lead lists, trust panel copy, marketing hints. |
| `command-center-feed.service.ts` | Merged chronological activity. |
| `command-center-alerts.service.ts` | High-signal approvals / spikes. |

All services use **additive Prisma reads** — safe defaults if tables are sparse.

## Demo / investor readiness

- Primary metrics are **data-backed** when the DB has rows; empty states use neutral copy (no fake dollar amounts in KPI tiles).
- Language stays **advisory** (“signals”, “pipeline value”, “posture”).
- Refresh timestamp shown in header for credibility during live walkthroughs.

## Performance notes

- Marketing + Expansion panel is **lazy-loaded** (`next/dynamic`) with a skeleton placeholder.
- Live feed column is **scroll-clamped** (`max-h`) to avoid layout thrash.
- Server page is `force-dynamic` so KPIs reflect current session context.

## Tests

See `modules/command-center/__tests__/command-center.test.ts` for visibility rules.
