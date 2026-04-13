# Developer docs — deployment and operations

Guides for safe Vercel deployments, environment separation, rollback, logging, and incidents.

| Document | Purpose |
|----------|---------|
| [branch-and-release-policy.md](./branch-and-release-policy.md) | Git branches, preview-first workflow, large-change review rule |
| [vercel-project-settings.md](./vercel-project-settings.md) | Dashboard checklist: production branch, preview, env scopes |
| [vercel-env.md](./vercel-env.md) | Required env vars by environment; client vs server secrets |
| [vercel-deploy-flow.md](./vercel-deploy-flow.md) | Preview → validate → promote; optional production hold |
| [vercel-rollback.md](./vercel-rollback.md) | Fast rollback and promote known-good deployment |
| [vercel-logs.md](./vercel-logs.md) | Build logs, runtime logs, CLI, retention notes |
| [vercel-command-reference.md](./vercel-command-reference.md) | Common Vercel CLI commands |
| [post-deploy-checklist.md](./post-deploy-checklist.md) | Smoke checks after every production deploy |
| [incident-response.md](./incident-response.md) | When production breaks: rollback, hotfix, re-promote |

**Health endpoints (apps/web):** `GET /api/health` (liveness), `GET /api/ready` (readiness, includes DB).
