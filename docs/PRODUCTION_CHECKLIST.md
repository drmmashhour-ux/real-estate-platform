# Production release checklist

Use this list before pointing **real users** at production.

## Migrations and data

- [ ] `npx prisma migrate deploy` applied successfully on production DB.
- [ ] **Tenant integrity** check passed (if you run `check-tenant-integrity` or equivalent).
- [ ] **Finance integrity** check passed (if you run `check-finance-integrity` or equivalent).

## Quality

- [ ] `npm run test` (and relevant workspace tests) **passing** on main/release branch.
- [ ] No known **blocking** bugs in critical flows.

## Environment

- [ ] Environment variables **verified** ([ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)).
- [ ] **No** dev/test API keys in production.
- [ ] `CRON_SECRET` set and **cron** routes protected.

## Backups and recovery

- [ ] **Backups enabled** (provider + optional `backup:db` job).
- [ ] **Restore tested** at least once on staging ([RESTORE_PROCEDURE.md](./RESTORE_PROCEDURE.md)).

## Operations

- [ ] `GET /api/health` and `GET /api/ready` return **200** when healthy.
- [ ] **No** unnecessary `LOG_VERBOSE` or debug flags in production.
- [ ] **Monitoring** (logs + metrics) in place ([MONITORING_METRICS.md](./MONITORING_METRICS.md)).
- [ ] **Alerting** rules defined ([ALERTING_RULES.md](./ALERTING_RULES.md)); stubs wired or logging to a sink.

## Product / demo

- [ ] **Demo/demo reset** disabled (`DEMO_MODE` off) unless this is a **demo-only** deployment.
- [ ] **Seed/demo** endpoints not exposed without auth in production.

## Multi-tenant and finance

- [ ] **Tenant switching** verified (no cross-tenant leakage).
- [ ] **Finance flows** validated (invoice, payment, commission paths as applicable).
- [ ] **Document uploads** validated (storage permissions and metadata).

## Rollback readiness

- [ ] Previous deployment artifact **pinned** and **rollback** path documented ([DEPLOYMENT.md](./DEPLOYMENT.md)).
