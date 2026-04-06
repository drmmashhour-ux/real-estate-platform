# Guardrails — LECIPM Manager AI

## Logging

- Every managed chat turn → `ManagerAiAgentRun` + console `lecipm_manager_run` event.
- Tool-driven mutations and approvals → `ManagerAiActionLog` + `lecipm_manager_action` event.

## Action policy

See `lib/ai/policies/action-policy.ts`:

- **Safe** — drafts, internal summaries, dismiss recommendation, promotion *suggestions* (as rows).
- **Guardrail** — admin-only flags, structured suggestions.
- **Requires approval** — live price, outbound guest messages, refunds, booking status changes, payout settings.
- **Forbidden** — fabricated metrics, legal claims as fact, raw payment ledger edits.

## Execute API

`POST /api/ai/actions/execute` with `allowManualSafe: true` lets signed-in users run **safe/guardrail** actions from the UI without global SAFE_AUTOPILOT. Forbidden and approval-only keys remain blocked.

## Approvals

`POST /api/ai/actions/request-approval` creates `ManagerAiApprovalRequest`. Admins use `/api/ai/actions/approve` or `reject`. When `notifyOnApproval` is on, admins get `ManagerAiNotificationLog` rows.

## Rate limiting

Managed chat: `checkRateLimit('ai:manager:${userId}')` in `managed-chat-handler.ts`.

## Failure modes

If OpenAI is unavailable, orchestrator returns a graceful string and still persists the user message. Compliance agent replies get a **non-legal-advice** disclaimer via `compliance-policy.ts`.

## Prompt injection

Tools never execute arbitrary SQL; inputs are validated and scoped by `userId` / admin checks. Context JSON is length-capped in the orchestrator.
