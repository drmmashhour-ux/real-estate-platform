# Autonomy modes

Canonical modes (stored in `ManagerAiPlatformSettings.globalMode`, normalized on read):

- `OFF` — no automation runner side effects; chat policy follows orchestrator.
- `ASSIST_ONLY` — assistive chat; automations that only log may still be disabled by kill switch.
- `RECOMMENDATIONS_ONLY` — create recommendations; no auto-apply of guarded actions.
- `SEMI_AUTONOMOUS` — recommendations + host autopilot **safe** paths only where host enabled.
- `AUTONOMOUS_SAFE` — policy-approved safe auto actions (maps to `AUTO_EXECUTE_SAFE` decision lane).
- `AUTONOMOUS_MAX_WITH_OVERRIDE` — maximize automation; risky actions queue approval / override items.

## Kill switches

- **Global:** `globalKillSwitch` on platform settings — hard stop for scheduled automation.
- **Temporal:** `autonomyPausedUntil` — pause window (e.g. incident response).
- **Per-domain:** `domainKillSwitchesJson` — e.g. `{ "trust_safety": true }` means domain paused.

## Scheduler

- Manual: `POST /api/ai/automations/run` (admin).
- Cron: `POST /api/cron/autonomy-tick` with `CRON_SECRET`.

Legacy DB values (`ASSISTANT`, `RECOMMENDATIONS`, `SAFE_AUTOPILOT`, `APPROVAL_AUTOPILOT`) are mapped to the new vocabulary in `lib/manager-ai/platform-settings.ts`.
