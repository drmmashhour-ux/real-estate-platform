# Operations

## Environment

- `CRON_SECRET` — required for `/api/cron/autonomy-tick`.
- `DATABASE_URL` — Prisma.
- OpenAI keys as already configured for `lib/ai/openai.ts`.

## Health

- `ManagerAiHealthEvent` rows from autonomy runner (warnings on repeated failures).
- UI: `/ai/health`.

## Troubleshooting

1. **Automations do nothing** — check `automationsEnabled`, `globalKillSwitch`, `autonomyPausedUntil`, per-domain JSON.
2. **Approvals stuck** — `/ai/approvals` and `ManagerAiApprovalRequest.status`.
3. **Host autopilot silent** — `ManagerAiHostAutopilotSettings.autopilotEnabled` and mode.

## Extension

Add a rule key in `automation-rules.ts`, implement case in `automation-engine.ts`, register in `AUTOMATION_RULE_DEFINITIONS`, and map the key in `lib/ai/autonomy/rules.ts`. Rules sync on each automation run via `syncAutomationRuleDefinitions`.
