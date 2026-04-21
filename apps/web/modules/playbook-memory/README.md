# Playbook Memory Engine

Decision-memory layer for LECIPM: record actions, attach outcomes, aggregate learning on **`MemoryPlaybook`** strategies (distinct from CRM **`conversion_playbooks`** / `Playbook`), rank candidates deterministically, and gate execution through policy — **memory recommends; policy + autonomy decide.**

## Prisma (`apps/web/prisma/schema.prisma`)

Models (tables):

| Model | Table |
|-------|--------|
| `PlaybookMemoryRecord` | `playbook_memory_records` |
| `MemoryPlaybook` | `memory_strategy_playbooks` |
| `MemoryPlaybookVersion` | `memory_playbook_versions` |
| `MemoryPlaybookOutcomeMetric` | `memory_playbook_outcome_metrics` |
| `MemoryPlaybookRetrievalIndex` | `memory_playbook_retrieval_indexes` |
| `MemoryPlaybookLifecycleEvent` | `memory_playbook_lifecycle_events` |

Enums: `MemoryDomain`, `MemorySource`, `MemoryOutcomeStatus`, `PlaybookStatus`, `PlaybookExecutionMode`, `PlaybookScoreBand`.

Apply DB changes (your environment):

```bash
cd apps/web && pnpm prisma migrate deploy
# or during development:
pnpm prisma db push
```

If the migration history has shadow DB issues locally, align baseline per your team’s Prisma workflow before deploying.

## Environment

| Variable | Purpose |
|----------|---------|
| `PLAYBOOK_MEMORY_API_SECRET` | Bearer token for `/api/playbook-memory/*` and `/api/memory-strategy/*` (optional; without it, **ADMIN** session only). |
| `CRON_SECRET` | Bearer for `/api/memory-strategy/recalculate` when used as a cron-style caller alongside admin/API secret. |

## HTTP API

**Internal decision memory**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/playbook-memory/record` | Create `PlaybookMemoryRecord` (idempotency via `idempotencyKey`). |
| `POST` | `/api/playbook-memory/outcome` | Update outcome (`kind: "update"`) or append metric (`kind: "metric"`). |
| `GET` | `/api/playbook-memory/recommendations?context=<JSON>` | Ranked recommendations (paused/archived never `allowed: true`). |

**Strategy playbooks** (named **`memory-strategy`** to avoid clashing with CRM `/conversion_playbooks`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/memory-strategy/playbooks` | List `MemoryPlaybook` rows. |
| `POST` | `/api/memory-strategy/playbooks` | Create playbook (`key`, `name`, `domain`). |
| `GET` | `/api/memory-strategy/playbooks/[id]` | Detail + versions. |
| `POST` | `/api/memory-strategy/playbooks/[id]/versions` | New version (`strategyDefinition` JSON). |
| `POST` | `/api/memory-strategy/playbooks/[id]/promote` | Body `{ "versionId" }` — activate version + set `currentVersionId`. |
| `POST` | `/api/memory-strategy/playbooks/[id]/pause` | Set status `PAUSED`. |
| `POST` | `/api/memory-strategy/recalculate` | Body `{ "playbookId" }` optional — single rollup, or full rollup when omitted. Accepts `CRON_SECRET` or playbook API secret / admin. |

> Spec paths like `GET /api/playbooks` map to **`/api/memory-strategy/playbooks`** here.

### Example: record decision

```http
POST /api/playbook-memory/record
Authorization: Bearer $PLAYBOOK_MEMORY_API_SECRET
Content-Type: application/json

{
  "source": "SYSTEM",
  "triggerEvent": "listing.price.updated",
  "actionType": "pricing.weekend_uplift",
  "context": {
    "domain": "PRICING",
    "entityType": "listing",
    "entityId": "lst_123",
    "market": { "city": "montreal", "demandBand": "high" },
    "segment": { "propertyType": "condo" }
  },
  "actionPayload": { "deltaPct": 6 },
  "idempotencyKey": "pricing:lst_123:2026-04-02T12:00:00Z"
}
```

### Example: recommendations

```http
GET /api/playbook-memory/recommendations?context=%7B%22domain%22%3A%22PRICING%22%2C%22entityType%22%3A%22listing%22%7D
Authorization: Bearer $PLAYBOOK_MEMORY_API_SECRET
```

Response includes `recommendations[]` with `allowed`, `blockedReasons`, `rationale`, `score`, `confidence`.

## Jobs (programmatic)

Import from `modules/playbook-memory/jobs/*`:

- `runPlaybookOutcomeBackfill`
- `runPlaybookLearningRollup`
- `runPlaybookLifecycleGovernor`
- `runPlaybookRetrievalIndexRefresh`

Wire to `CRON_SECRET` routes the same way as other workers under `app/api/cron/*` if desired.

## Safety rules (enforced in code)

- **No outbound customer messaging** from this module; action types like `send_customer_message` are blocked from autopilot-style modes in `playbook-memory-policy-gate.service.ts`.
- High-risk domains (`MESSAGING`, `RISK`) cannot use `FULL_AUTOPILOT` / `SAFE_AUTOPILOT` per `HIGH_RISK_MEMORY_DOMAINS`.
- Recommendations never mark `allowed: true` for non-`ACTIVE` playbooks or without a `currentVersionId`.

## Telemetry

In-process counters in `playbook-memory.telemetry.ts`; structured logs use prefix **`[playbook]`** via `playbook-memory.logger.ts`.

## Tests

```bash
pnpm exec vitest run modules/playbook-memory/tests
```

## TODO (domain integrations)

- Richer outcome attribution from finance / attribution pipelines.
- Deduped retrieval index upserts (V1 inserts rows per refresh batch).
- Deeper integration with `evaluateGrowthPolicies` context shape when wiring ads/growth.
