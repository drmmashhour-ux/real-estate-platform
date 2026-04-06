# Overrides

1. **Approval queue** — `ManagerAiApprovalRequest` for actions classified as requiring approval.
2. **Override events** — `ManagerAiOverrideEvent` records admin actions: kill switch, pause/resume, domain toggles (audit trail).
3. **Host autopilot** — Host turns off autopilot or sets `OFF` / `ASSIST` in `ManagerAiHostAutopilotSettings`.

API:

- `POST /api/ai/autonomy/kill-switch` — admin sets global kill switch.
- `POST /api/ai/autonomy/pause` | `resume` — admin temporal pause.
- `GET/POST /api/ai/overrides` — list recent override events / record manual override note.
