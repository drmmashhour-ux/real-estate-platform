# AI / autopilot production rollout

This document complements code gates in `apps/web/lib/manager-ai/platform-settings.ts`, `apps/web/lib/ai/rollout-guards.ts`, and admin AI settings UI.

## Kill switches (fastest path)

| Mechanism | Effect |
|-----------|--------|
| **`LECIPM_AI_AUTONOMY_KILL_SWITCH=1`** (Vercel env) | Hard-off without reading DB: `getManagerAiPlatformSettings()` returns conservative defaults (automations off, global kill switch on). |
| **Admin “global kill switch”** (DB) | Persisted in `ManagerAiPlatformSettings`; respected after successful DB read (subject to cache TTL). |
| **`LECIPM_HOST_AUTOPILOT_API_ENABLED=0`** | Blocks **`POST /api/ai/host-autopilot/run`** immediately (host trigger endpoint). |

## Optional env feature gates

Unset = **enabled** (no behavior change). Set to `0`, `false`, `no`, or `off` to disable.

| Variable | Purpose |
|----------|---------|
| `LECIPM_AI_LEARNING_ENABLED` | Hook for learning surfaces (extend callers as needed). |
| `LECIPM_AI_DECISION_RANKING_ENABLED` | Hook for decision-ranking paths (extend callers as needed). |

## Suggested rollout order

1. **Read-only insights** — dashboards and recommendations with no side effects.
2. **Draft recommendations** — persisted proposals, no auto-apply.
3. **Manual approve / reject** — human-in-the-loop for external or risky actions.
4. **Limited auto-apply** — only categories already classified as low-risk in the system-brain router.
5. **Broader automation** — only after audit volume, monitoring, and rollback drills.

## Audit and safety

- Persist **decisions** and **approvals** in existing autonomy / autopilot tables and audit logs where implemented.
- Do **not** auto-send sensitive external communications without explicit policy + approval paths.
- Do **not** auto-modify payment- or legal-critical records without approval and a reversible workflow.

## Operations

- On incidents: set **`LECIPM_AI_AUTONOMY_KILL_SWITCH=1`**, redeploy, then fix root cause.
- After stabilizing: clear the env flag and use admin UI to restore intended autonomy mode.
