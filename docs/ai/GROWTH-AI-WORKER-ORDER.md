# Growth AI — recommended worker / cron order

When scheduling **self-learning** and the **autonomous deal closer** (orchestration layer), run them in this order:

1. **Self-learning first** — `POST /api/cron/learning-recompute-worker` (template performance rollups and recommendations that feed adaptive routing in `resolveAdaptiveTemplateSelection`).
2. **Autonomous deal closer second** — `POST /api/cron/autonomous-deal-closer-worker` (orchestration queue: assignment, next-action prompts, SLA reassignment), when that route is deployed.

## Why this order

- The **self-learning layer** improves **template selection quality** (what gets said, and with which copy).
- The **autonomous deal closer** then **acts on better decisions** — routing, assignment, and follow-up steps align with messaging that already benefits from refreshed rollups.

## Related jobs (typical cadence)

- **Auto-reply worker** (`/api/cron/auto-reply-worker`) consumes live learning when `AI_SELF_LEARNING_ROUTING_ENABLED=1`. In the same maintenance window, run **learning recompute before** auto-reply if you want the latest rollups applied to new replies.
- **Silent nudge worker** is independent; keep its existing schedule.

## Env flags (reference)

| Flag | Role |
|------|------|
| `AI_SELF_LEARNING_ROUTING_ENABLED` | Enables self-learning picks in the reply engine (default off). |
| `AI_AUTONOMOUS_DEAL_CLOSER_ENABLED` | Enables autonomous orchestration (default off). |

Both can be on in production only after migrations and ops sign-off; ordering still applies whenever both run.
