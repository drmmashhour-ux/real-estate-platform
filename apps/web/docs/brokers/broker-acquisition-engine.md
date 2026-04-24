# Broker Acquisition Engine (V1)

Internal workflow to track broker prospects, run outreach, and convert **first paying brokers** — **additive**, **feature-flagged**, and **not** a full CRM.

## Purpose

- Track every outbound broker conversation in a **lightweight pipeline**
- Copy **outreach scripts** (clipboard only — no auto-send)
- Show **anonymized lead preview** to demonstrate value
- Surface **daily action lines** for operators
- **Optional** JSON persistence on a single server instance (`BROKER_PIPELINE_JSON_PATH`)

## Enable

- `FEATURE_BROKER_ACQUISITION_V1=1` (see `engineFlags.brokerAcquisitionV1` in `apps/web/config/feature-flags.ts`)
- Optional: `BROKER_PIPELINE_JSON_PATH=./.data/broker-pipeline-v1.json` (relative to app cwd)

## Where to use it

| Surface | Path / API |
|--------|------------|
| **Primary dashboard** | `/admin/brokers-acquisition` (admin session) |
| **Legacy redirect** | `/admin/broker-pipeline` → redirects to `/admin/brokers-acquisition` |
| **DB-backed CRM (legacy)** | `/admin/broker-acquisition-legacy` — Prisma `broker-prospects` UI (unchanged) |
| **API** | `GET \| POST \| PATCH /api/admin/broker-pipeline-v1` (admin + flag) |

## Broker stages

`new` → `contacted` → `replied` → `demo` → `converted` | `lost`

## Outreach workflow

1. Add prospects (**Quick add** — `BrokerQuickAddForm`).
2. Use per-card **Copy** buttons for scripts (`first_message`, `follow_up`, `demo_pitch`, `close`). Copy updates `lastContactAt` / `lastMessageType` and increments monitoring (`scriptsCopied`).
3. Move stage via dropdown; add timestamped **notes** (array in V1).
4. **Mark demo shown** — operator flag when anonymized demo was shown (no paid unlock).
5. **Mark purchase** — manual conversion + optional `totalSpent` when payment mapping is not automated.

Scripts live in `apps/web/modules/brokers/broker-outreach.service.ts` (`getBrokerOutreachScriptList`).

## Lead preview

- Service: `buildBrokerLeadPreview()` in `broker-lead-preview.service.ts`
- UI: `BrokerLeadPreview` — **illustrative** rows only; disclaimer shown; no live PII

## Daily actions

`getBrokerDailyActions({ prospects })` in `broker-daily-actions.service.ts` — deterministic, max 5 lines (contact new, follow up, demo, close).

## Conversion marking

- **Manual:** PATCH `mark_purchase` via API or **Mark purchase** in UI.
- **Helpers:** `markBrokerConverted`, `tryMarkProspectConvertedByBrokerEmail` in `broker-conversion.service.ts` (additive; call from future hooks — **does not** change Stripe webhooks in V1).
- **Existing:** Broker **unlock checkout** still records `recordBrokerConversionAttempt` when flag is on (`/api/lecipm/leads/[id]/unlock-checkout`) — unchanged payment behavior.

## Monitoring

`broker-monitoring.service.ts` — in-process counters + `[broker]` logs (never throws). Use `getBrokerMonitoringSnapshot()` and `resetBrokerMonitoringForTests()`.

Counters include: `prospectsAdded`, `stageChanges`, `notesAdded`, `scriptsCopied`, `conversionsMarked`, `lostDeals`, `conversionAttempts`, `missingDataWarnings`.

## Safety

- **No** Stripe, booking, or core lead logic changes in this module set
- **No** external messaging automation — clipboard only
- **Bounded** store (default max 5k prospects in memory)

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/brokers/__tests__/
```
