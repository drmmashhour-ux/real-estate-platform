# Policies

## Action classes (`lib/ai/policies/domain-policy.ts`)

- `SAFE_AUTOMATIC` — drafts, internal notes, recommendations.
- `SAFE_WITH_NOTICE` — auto changes with in-app notice (host autopilot + safe listing fields).
- `SAFE_WITH_LOG_ONLY` — telemetry-only.
- `APPROVAL_OPTIONAL` — host/platform may allow without approval when explicitly configured.
- `APPROVAL_REQUIRED` — refunds, booking state changes, live pricing, external novel messages.
- `BLOCKED` — forbidden keys in `action-policy.ts` (fabrication, direct payment edits, etc.).

## Existing classification

`lib/ai/policies/action-policy.ts` — `classifyActionKey`, `mayAutoExecute`.

## Compliance

`lib/ai/policies/compliance-policy.ts` — disclaimers on user-visible AI text.
