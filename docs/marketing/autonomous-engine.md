# Autonomous Marketing Engine

Located in `apps/web/modules/marketing-ai/`. Admin UI: `/dashboard/admin/marketing/ai` (locale-prefixed). Integrates with the **Content Calendar** (`marketing-content`), **Revenue Predictor**, and **AI Sales Manager** via dashboard links — attribution uses `content-performance.service.ts` (views, clicks, leads, revenue cents).

## Autonomy levels

| Level | Behavior |
|--------|-----------|
| **OFF** | Manual only — no automatic queue fills from the planner. |
| **ASSIST** | Generates weekly plans and copy packs; nothing enters the approval queue unless you enqueue from the UI (future shortcut) or switch mode. |
| **SAFE_AUTOPILOT** | Generates the weekly plan **and** enqueues each slot as **PENDING_APPROVAL**. Admin must **Approve**, then **Push to calendar**. |
| **FULL_AUTOPILOT** | Reserved — auto-post adapters not wired yet; UI keeps this disabled until providers are authenticated. |

Default stance is **semi-autonomous**: generation and scheduling suggestions run locally; **posting always requires approval** before calendar materialization in SAFE mode.

## Generation logic

`marketing-ai-generator.service.ts` produces hooks, short-form scripts (timestamp beats), captions, and CTAs from **audience**, **goal**, and **topic** using deterministic templates (no external LLM). Replace `generateMarketingPack()` with an LLM provider later without changing callers.

## Planning logic

`generateWeeklyPlan()`:

1. Reads **posted** items from the Content Calendar store.
2. Builds **performance insights** (platform / audience / type averages, lead and revenue averages).
3. Merges **optimizer weights** with **learning** multipliers (`marketing-ai-learning.service.ts`).
4. Uses `distributeWeeklySlots()` to spread up to N slots across 7 days with a **per-day cap** (default 2).
5. Picks morning/evening slots via `suggestPostingSlot()` to reduce overload.

## Optimization & learning

- **Optimizer** (`marketing-ai-optimizer.service.ts`): ranks posts, surfaces best/worst platforms and formats, emits `PlannerWeights`.
- **Learning** (`marketing-ai-learning.service.ts`): rolling scores for platforms, audiences, hook templates, and time-slot guesses from **POSTED** rows with metrics.
- Click **Sync learning from calendar** in the admin UI to ingest latest posted performance into learning state.

## Scheduling heuristics

`marketing-ai-scheduler.service.ts`:

- Morning vs evening preference alternates by weekday offset.
- Weekly distribution avoids stacking too many posts on one day.

## Approval flow

1. Queue rows (`marketing-ai-approval.service.ts`) capture generated packs and proposed schedule day.
2. **Approve** / **Reject** append to **approval logs** (local storage + optional server mirror for mobile).
3. **Push to calendar** creates or updates a **Content Calendar** item as **SCHEDULED** with hook, script, and caption.

## Alerts

`marketing-ai-alerts.service.ts` evaluates calendar items for empty today’s slot, high performers, and low-engagement trends.

## Mobile

- `GET /api/mobile/admin/marketing-ai/daily?date=` — daily slice of plan + queue + alerts (requires admin JWT).
- `POST /api/mobile/admin/marketing-ai/approve` — approve/reject queue rows on **server-synced** store.
- Browser UI syncs local state to the server via `POST /api/dashboard/marketing/marketing-ai/sync` so mobile reads follow the latest admin session on the same deployment.

## Tests

See `apps/web/modules/marketing-ai/__tests__/marketing-ai.test.ts`.
