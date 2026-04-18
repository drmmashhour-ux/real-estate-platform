# BNHub autopilot execution (SAFE V1)

Controlled listing improvements with **human approval**, **optional apply**, and **rollback** for mutating changes. This does **not** change bookings, Stripe, payments, or ranking engines. **Prices are never auto-applied** — pricing rows are suggestions only.

## Feature flags (default off)

| Env | Purpose |
|-----|---------|
| `FEATURE_BNHUB_AUTOPILOT_V1` | API + UI for generating actions, approve/reject, listing action list |
| `FEATURE_BNHUB_AUTOPILOT_EXECUTION_V1` | Apply approved **safe** actions (title, description, amenities append) |
| `FEATURE_BNHUB_AUTOPILOT_ROLLBACK_V1` | Restore previous field values after execution |

## What is executed

When execution is enabled, only these types update the database:

- `IMPROVE_TITLE` → `shortTermListing.title`
- `IMPROVE_DESCRIPTION` → `shortTermListing.description`
- `ADD_AMENITIES` → merge/dedupe into `shortTermListing.amenities`

Each successful mutation stores a **rollback snapshot** (previous value) in memory on the server process.

## What is NOT executed

These action types are **never** auto-applied by the execution service:

- `PRICING_SUGGESTION` — advisory note only
- `TRUST_IMPROVEMENT` — checklist only
- `ADD_PHOTO_SUGGESTION` — host must upload photos

They can still appear as **pending** actions for tracking and approval workflow; approving them does not change prices or upload images.

## Approval flow

1. Host clicks **Generate actions** (or call `POST /api/bnhub/autopilot/generate`).
2. Up to **5** pending actions are registered (in-memory store for the running server).
3. Host **Approves** or **Rejects** each pending action (`approve` / `reject` only if `status === "pending"`).
4. If execution is enabled, host runs **Execute** on a single approved safe action, or **Execute approved (safe)** for the listing batch.

## Rollback

After an action reaches `executed` and rollback is enabled, **Rollback** restores the snapshot field on the listing and marks the action `rejected` (workflow signal that the change was undone).

## Operational limits

- **In-memory** action registry and rollback snapshots: not shared across serverless instances or restarts. Treat as best-effort for single-node or sticky sessions until a durable store is added.

## Monitoring

Server logs use the prefix `[bnhub:autopilot]` for built, approved, rejected, executed, and rolled-back events. Counters are exposed via `getBnhubAutopilotMonitoringSnapshot()` for tests and diagnostics.
