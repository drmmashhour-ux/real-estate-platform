# Automations

Defined in `lib/ai/actions/automation-rules.ts`, executed by `automation-engine.ts`, batch-run via `POST /api/ai/automations/run` (admin, respects `automationsEnabled` in platform settings).

## Rules (initial)

1. **listing_completion** — DRAFT STR listings with missing core fields → recommendation.
2. **stalled_booking** — `PENDING` / `AWAITING_HOST_APPROVAL` stale 48h → recommendation.
3. **pricing_opportunity** — published listing, zero completed stays → soft promotion suggestion.
4. **host_payout_readiness** — published listing, incomplete Stripe Connect → recommendation.
5. **trust_review_signal** — open disputes → admin recommendation.
6. **admin_daily_summary** — one reminder card per UTC day to first admin.

All rules are **idempotent-friendly** (skip when a similar active row exists) and **log** via `ManagerAiAgentRun`.

## UI

`/ai/automations` lists `ManagerAiAutomationRule` rows, toggles `enabled`, and triggers a full run.
