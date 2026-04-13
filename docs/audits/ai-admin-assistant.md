# AI Admin Assistant (LECIPM)

Operational intelligence layer for admins: persisted insights, rule-based alerts, optional LLM polish (strictly grounded), and a signals-only Q&amp;A path.

## Schema

PostgreSQL enums and tables (see `apps/web/prisma/schema.prisma`):

- `AdminAiInsightType`: `daily_summary`, `alert`, `recommendation`, `listing_diagnosis`, `revenue_summary`, `user_intent_summary`
- `AdminAiInsightPriority`: `low`, `medium`, `high`, `critical`
- `AdminAiEntityType`: `listing`, `user`, `revenue`, `document_request`, `payment`, `support`, `funnel`
- `AdminAiRunStatus`: `queued`, `running`, `completed`, `failed`

Tables:

- `admin_ai_insights` — `id` (uuid), `type`, `title`, `body`, `priority`, optional `entityType` / `entityId`, `metadata_json`, `created_at`
- `admin_ai_runs` — run log for orchestrated jobs (`run_type`, `status`, timestamps, `summary`)

Migration: `apps/web/prisma/migrations/20260422170000_admin_ai_assistant/migration.sql`

## Platform signals

Implemented in `lib/admin-ai/get-platform-signals.ts`. Aggregates (primarily **rolling 7d** aligned with `getPlatformStats(7)`, plus **prior 7d** for comparisons):

- Traffic: `platform_analytics` visitors, `traffic_events`, funnel `session_id` cardinality, buyer listing views
- Conversion: funnel event counts (`analytics_events`)
- Users: signups by persona, seller modes, investors, document/OACIQ-style queues
- Listings: `listing_analytics` high-traffic/low-conversion, demand leaders, FSBO missing images, short descriptions
- Revenue: `platform_payment` sums by window and by `payment_type`, top listing-attributed revenue (CRM vs FSBO)
- Support: form submission volume week-over-week, failed platform payments

All metrics are **queried from the database** — generators must not invent numbers.

## Generated insight types

| Type | Source |
|------|--------|
| `daily_summary` | Template + optional OpenAI polish over compact JSON facts |
| `alert` | Rule thresholds on signals (traffic drop, payment failures, doc load, etc.) |
| `recommendation` | Action-oriented rows tied to entities when possible (URLs in `metadata_json.href`) |
| `listing_diagnosis` | Heuristics from analytics + content signals |
| `user_intent_summary` | Aggregated persona/mode + funnel subset |
| `revenue_summary` | Revenue totals, WoW delta, payment_type breakdown |

Orchestration: `lib/admin-ai/run-daily-admin-ai.ts` creates an `AdminAiRun`, loads signals, runs generators, `createMany` insights, completes the run.

## Safety rules

- No invented metrics — LLM prompts include `FACTS_JSON` only; fallback templates if OpenAI is missing or returns `FALLBACK_ONLY`
- No legal/tax advice in copy
- No auto-mutations, no auto-outreach in MVP
- Recommendations are **human-reviewed** actions with links into existing admin surfaces

## Query behavior (`query-admin-ai`)

1. Load fresh `PlatformSignals` via `getPlatformSignals()`
2. Fast path: keyword routing for common questions (traffic waste, broker help, revenue, funnel, OACIQ/docs)
3. Optional OpenAI answer with `FACTS_JSON` in-context; temperature `0` where used
4. If OpenAI unavailable, `polishAdminCopy` fallback or `"Not available in current platform signals"`

## API (admin-only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin-ai/insights` | List insights (`limit`, optional `type`) |
| GET | `/api/admin-ai/runs` | Recent runs |
| POST | `/api/admin-ai/run` | Trigger full intelligence run (`runType`, default `full_daily`) |
| POST | `/api/admin-ai/query` | `{ "question": "..." }` |

Guards: `getUserRole()` + `isHubAdminRole()` (hub **ADMIN** cookie).

## UI

- Route: `/admin/assistant` (`apps/web/app/[locale]/[country]/admin/assistant/page.tsx`)
- Full **Run intelligence** requires Prisma `User.role === ADMIN` (accountants may view read-only UI)

## Future extensions

- Cron / Vercel cron hitting `POST /api/admin-ai/run` with a secret
- Per-insight dedupe and TTL
- Stronger “stuck seller” detection from `sellerHubOnboardingJson` / FSBO status
- Embeddings over insights for semantic search
- Accountant read-only API policy aligned with layout
