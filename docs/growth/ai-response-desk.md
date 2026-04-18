# AI Response Desk (V1)

## Purpose

The **Response Desk** is an **internal admin-only** workflow on top of messaging assist drafts and the follow-up queue. Operators can:

- See a **prioritized queue** of leads that need attention
- **Filter** by priority, follow-up, draft state, and review state
- **Copy** draft text (clipboard only — no send)
- **Mark** internal review metadata (`needs_review` / `reviewed` / `done`) when `FEATURE_AI_RESPONSE_DESK_REVIEW_STATE_V1` is on

There is **no** email, SMS, WhatsApp, or automated outbound messaging. **No** Stripe, bookings, ads, CRO, or ranking changes.

## Workflow states

### Display status (`AiResponseDeskStatus`)

Derived for sorting and UI:

| Status | Meaning |
| --- | --- |
| `draft_ready` | Draft text available and/or high-intent emphasis |
| `needs_review` | Default review bucket or persisted `needs_review` |
| `reviewed` | Persisted operator mark |
| `followup_recommended` | Follow-up queue signals due / urgent |
| `done` | Persisted operator mark (cleared from default filters) |

### Persisted review state (`Lead.aiExplanation.aiMessagingAssist`)

Optional fields on the existing messaging assist JSON (additive):

- `reviewState`: `"needs_review"` \| `"reviewed"` \| `"done"`
- `reviewUpdatedAt`: ISO timestamp

Writes require an existing `aiMessagingAssist` object (draft shell from messaging assist execution or prior merge). Original `Lead.message` is never overwritten.

## Queue ordering rules

Deterministic sort in `sortResponseDeskItems`:

1. Higher **sort tier** first: high-intent leads → follow-up urgency → draft/follow-up recommended bucket → rest
2. Tie-break: `leadId` ascending

Only leads with **at least one** of: messaging draft, active follow-up (not `done`), or persisted review state are listed (compact queue).

## Admin usage

1. Enable `FEATURE_AI_RESPONSE_DESK_V1` (and optionally `FEATURE_AI_RESPONSE_DESK_REVIEW_STATE_V1`).
2. Open **Admin → Early users** (`/admin/.../early-users` as routed): **Response Desk** appears **above** the existing lead intelligence section.
3. Use filters and action buttons; **Copy** uses the clipboard and logs telemetry only.

## Safety guarantees

- Draft-only; human-controlled.
- Review state is metadata on `aiExplanation` — no send pipeline.
- `mergeAiMessagingAssistIntoExplanation` preserves `reviewState` when autopilot refreshes draft text (additive merge).

## Feature flags

| Env | Default |
| --- | --- |
| `FEATURE_AI_RESPONSE_DESK_V1` | off — hides panel |
| `FEATURE_AI_RESPONSE_DESK_REVIEW_STATE_V1` | off — read-only desk (no mark buttons) |

## Telemetry

- Log prefix: `[autopilot:response-desk]`
- Routes: `POST /api/admin/autopilot/response-desk/telemetry`, `POST /api/admin/autopilot/response-desk/state` (review actions; admin session required)

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/ai-response-desk*.test.ts
pnpm exec eslint modules/growth/ai-response-desk*.ts components/admin/leads/LeadResponseDesk*.tsx app/api/admin/autopilot/response-desk/**/*.ts
```
