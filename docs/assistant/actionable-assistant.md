# Actionable broker assistant

## Overview

The floating broker assistant still produces **deterministic, explainable** coaching copy. When the environment is in **`SAFE_AUTOPILOT`** (default) or **`FULL_AUTOPILOT`**, suggestions may include **executable actions**. Nothing runs automatically: every outbound or state-changing action requires an explicit **Confirm** in the UI (SAFE policy).

## Safety modes (`LECIPM_BROKER_ASSISTANT_MODE`)

| Mode | Behaviour |
|------|-----------|
| `OFF` | No suggestions. |
| `ASSIST` | Suggestions only; executable metadata is stripped server-side. |
| `SAFE_AUTOPILOT` | Suggestions + **Execute** → confirmation modal → `/api/assistant/execute`. |
| `FULL_AUTOPILOT` | Same confirmation requirement as SAFE in this codebase (no silent sends). |

Unset env defaults to **`SAFE_AUTOPILOT`**.

## Action model

Each `AssistantSuggestion` may include:

- `id` — stable hash for UI state.
- `actionType` — e.g. `SEND_FOLLOWUP`, `SCHEDULE_VISIT`, `REQUEST_OFFER_UPDATE`.
- `actionPayload` — IDs (`leadId`, `dealId`, optional `visitId` / window for reschedule).
- `requiresConfirmation` — default `true`; drives the modal.

## Execution flow

1. `GET /api/assistant/suggestions` returns suggestions + `assistantMode`.
2. User clicks **Execute…** → modal summarizes risk and payload.
3. **Confirm** → `POST /api/assistant/execute` with `{ actionType, actionPayload, confirmed: true }`.
4. `executeAssistantAction` validates broker access, mode, and confirmation.
5. Outcome is logged via `BROKER_ASSISTANT_EXEC` on the lead timeline when a `leadId` exists.

## Integrations

| Action | Behaviour |
|--------|-----------|
| `SEND_FOLLOWUP` | `buildAiSalesFollowUpValue` + transactional email (respects opt-out). |
| `SCHEDULE_VISIT` | Returns a deep link to the lead workspace (no auto-booking). |
| `RESCHEDULE_VISIT` | Delegates to `rescheduleLecipmVisit` (LECIPM visit engine). |
| `ESCALATE_TO_ADMIN` | Email to `LECIPM_OPS_EMAIL` when set + timeline log. |
| `ASSIGN_BROKER` | **Admin only** — updates `introducedByBrokerId`. |
| `SEND_SIMILAR_LISTINGS` | Logs + returns browse deep link with context. |
| `REQUEST_OFFER_UPDATE` | Timeline note on linked deal lead when present. |

## Mobile

`POST /api/mobile/assistant/execute` mirrors the web route; uses broker mobile session (`requireMobileBrokerUser`).

## Tests

See `apps/web/modules/assistant/__tests__/assistant-action.test.ts`.

## Ops environment

- `LECIPM_OPS_EMAIL` — destination for `ESCALATE_TO_ADMIN`.
