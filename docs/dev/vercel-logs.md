# Logs: builds and runtime (Vercel)

Goal: **find failures quickly** after deploy or when users report issues.

## Build logs

**Where:** Vercel → **Project → Deployments** → select a deployment → **Building** / **Build** section.

**What to check:**

- Install step (`pnpm install`, monorepo `cd ../..` per `apps/web/vercel.json`).
- `pnpm build:web` (or configured `buildCommand`) exit code.
- Next.js compile errors, Prisma client generation, missing `NEXT_PUBLIC_*` at build time.

**CLI (inspect a deployment’s build):**

```bash
vercel inspect <deployment-url-or-id>
```

Use the same deployment URL from `vercel ls` or the dashboard.

## Runtime logs (serverless / Node)

**Where:** Vercel → **Project → Deployments** → select deployment → **Logs** (or **Functions** / **Runtime Logs** depending on UI).

**What you see:**

- `console.log` / `console.error` from Route Handlers, Server Actions, and server components running on the server runtime.
- Request-level entries for serverless invocations (when enabled for your plan).

**CLI (stream recent logs):**

```bash
# Link project once: vercel link
vercel logs <deployment-url-or-id>
# Or follow live (options vary by CLI version):
vercel logs --follow
```

Run `vercel logs --help` for the current flags.

## Log retention and long-term storage

- **Vercel log retention** is **limited by plan** and is not indefinite archival.
- For **months-long retention**, search, and alerting, plan an **external drain** (e.g. Axiom, Datadog, Grafana Cloud, or Sentry for errors).  
  **TODO:** When the team outgrows dashboard logs, add a log drain integration and document it here.

## Errors to check after every production deploy

At minimum:

1. **Build:** Deployment status **Ready** (not Error).
2. **Runtime:** No spike in 5xx for `/`, `/api/health`, `/api/ready`.
3. **App:** [post-deploy-checklist.md](./post-deploy-checklist.md).

If `/api/ready` returns **503**, check:

- `DATABASE_URL` and DB reachability (see JSON body from `/api/ready`).
- Recent migrations (`prisma migrate deploy`) if the deploy included schema changes.

## Related endpoints (apps/web)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness — process up; **no DB** (cheap probe). |
| `GET /api/ready` | Readiness — DB query + i18n/market checks; use for deeper gates. |

## Related

- [vercel-command-reference.md](./vercel-command-reference.md)  
- [incident-response.md](./incident-response.md)  
