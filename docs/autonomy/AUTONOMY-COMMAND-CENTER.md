# Autonomy Command Center (Executive AI Control Layer)

## Purpose

The **Autonomy Command Center** is the highest-level LECIPM surface to **observe, explain, and control** bounded full-autopilot execution. It does not replace policy engines, deal workflows, or compliance services; it **aggregates** their signals and routes control actions to the same services used by the Full Autopilot operator console.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `buildAutonomyCommandCenterPayload` | Server bundle: full-autopilot core payload, executive KPIs, Prisma rollups, live feed, marketing/risk/deal heuristics. |
| `buildFullAutopilotControlCenterPayload` | Canonical autopilot matrix, approvals, audit feed, metrics, alerts, recommendations. |
| API — `/api/autonomy-command-center/*` | Admin-gated reads and control posts (pause, quick mode, domain slot, emergency kill, recompute, learning reset audit, item drilldown). |
| API — `/api/mobile/admin/autonomy-command-center/*` | Mobile admin auth; reduced JSON for summary, pause, emergency kill. |
| Web UI | `app/dashboard/admin/autonomy-command-center/page.tsx` + `components/autonomy/*` (black / gold “executive” chrome). |

## Domains (executive groupings)

Technical domains live in `autopilot-domain-matrix.service`. The UI groups them for operator mental models:

- **Marketing** — `marketing_*`
- **Sales / AI agent** — `lead_routing`, `ai_followup_sequences`, `broker_assistant_actions`
- **Booking** — `booking_slot_suggestion`
- **No-show prevention** — `no_show_reminders`
- **Post-visit** — `post_visit_followups`
- **Deal intelligence** — `deal_intelligence_guided_actions`
- **Investment / allocator** — `capital_allocator_recommendations`, `investment_actions`
- **Marketplace optimization** — `marketplace_optimization_proposals`, `pricing`
- **Compliance** — `compliance_actions`

Group actions call `applyUiDomainSlot` / `killUiDomainGroup`, which expand to per-technical-domain `setDomainMode` / `setDomainKillSwitch` with **matrix-respecting** target modes (e.g. `FULL` never bypasses approval on capital or pricing).

## Controls

| Control | Behavior |
| --- | --- |
| Pause / Resume | `pauseAllAutonomy` → global autopilot pause singleton. |
| Quick mode ASSIST / SAFE / FULL | Applies `modeForQuickSwitch` across **every** technical domain (policy caps persist per matrix row). |
| Emergency kill | Pauses globally **and** sets kill-switch **OFF** on all domains. |
| Domain matrix slot | OFF / ASSIST / SAFE / FULL per executive lane (`persistedModeForUiSlot`). |
| Kill lane | Kill-switch OFF for each underlying technical domain in the lane. |
| Approvals | Proxied to `/api/full-autopilot/approvals/:id/(approve|reject)` — unchanged orchestration. |
| Force recompute | Refreshes autopilot alerts + recommendation snapshot (`evaluateAutopilotAlerts`, `recommendDomainModes`). |
| Reset learning | **Audit-only** (`AUTONOMY_LEARNING_RESET_REQUESTED`) — destructive resets remain backend workflows. |

## Operator workflow

1. Read **System Overview** + autonomy rollup (`ON` / `LIMITED` / `OFF`).
2. Scan **Live feed** + **Alerts** for anomalies.
3. Adjust **Quick mode** or **Domain matrix** when posture changes (launch, incident, regulatory review).
4. Clear **Approval queue** items with documented rationale (pricing, allocator, marketplace apply).
5. Drill into `/dashboard/admin/autonomy-command-center/[itemId]` for detailed execution / approval traces (`GET /api/autonomy-command-center/item/:id`).
6. Use **Emergency kill** only when systemic halt is required — resume deliberately after review.

## Related endpoints

- Legacy UI parity: `/dashboard/admin/full-autopilot`
- Execution JSON (alternate path): `/api/full-autopilot/execution/[executionId]`

## Mobile apps

There is no standalone `apps/mobile` package in this repo. Operator surfaces use authenticated JSON routes instead:

- `GET /api/mobile/admin/autonomy-command-center/summary` — compact overview, approvals, alerts, feed.
- `POST /api/mobile/admin/autonomy-command-center/pause` — global pause / resume (`{ paused: boolean }`).
- `POST /api/mobile/admin/autonomy-command-center/emergency-kill` — same semantics as web emergency kill.
