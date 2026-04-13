# Security documentation

Operational and engineering references for hardening the LECIPM platform (web app: `apps/web`).

## Architecture (summary)

- **Authentication:** Session cookie (`lecipm_guest_id`) backed by DB `Session` rows; resolved server-side to `User.id`. No long-lived JWT in localStorage for core web auth.
- **Authorization:** Route handlers and server actions must check **role** and **ownership** via Prisma — do not trust client-supplied user or listing IDs for privileged actions.
- **Transport:** HTTPS on Vercel; security headers from `apps/web/lib/security/http-security-headers.ts` via `next.config.ts`.
- **Secrets:** Server-only env vars; `NEXT_PUBLIC_*` is browser-visible.
- **Rate limiting:** In-memory + optional Redis (`REDIS_URL`) via `lib/rate-limit-distributed.ts`.
- **Observability:** Structured security lines (`logSecurityEvent`) + durable `PlatformEvent` rows for select events (`lib/security/security-logger.ts`).

## Key protections

| Area | Mechanism |
|------|-----------|
| HTTP | CSP `frame-ancestors`, HSTS (prod), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Auth API | Rate limits, IP block after abuse, generic errors on login failure |
| Webhooks | Stripe `constructEvent` signature required before handling |
| Incidents | Kill-switch env vars, rollback docs in `docs/dev/` |
| Admin | `requireAdminSession` / `requireAdminControlUserId` |

## Known limitations

- **RLS:** If the database is plain Postgres (Neon) with Prisma, **Postgres RLS is not applied** unless you connect with a role subject to RLS and avoid superuser bypass. **Authorization is enforced in application code.** If you use **Supabase** with the Supabase client and `anon` key, enable and test RLS separately ([rls-policies.md](./rls-policies.md)).
- **Rate limits:** Without Redis, limits are per-instance in serverless (eventual consistency across cells is weaker).
- **Log retention:** Vercel logs are time-bounded; long-term audit needs a drain (see [vercel-logs.md](../dev/vercel-logs.md)).

## Operational checklist

- [ ] Production env vars reviewed ([env-security.md](./env-security.md))
- [ ] Preview uses test Stripe keys and non-prod DB ([../dev/vercel-env.md](../dev/vercel-env.md))
- [ ] After production deploy: [post-deploy checklist](../dev/post-deploy-checklist.md) + [release-security-checklist.md](./release-security-checklist.md)
- [ ] On incident: [incident-response.md](./incident-response.md) and [../dev/vercel-rollback.md](../dev/vercel-rollback.md)

## Document index

| Doc | Topic |
|-----|--------|
| [github-security.md](./github-security.md) | Code scanning, secret scanning, Dependabot (alerts + version updates) |
| [snyk.md](./snyk.md) | Snyk CLI in CI (`test` + `monitor`) |
| [zap.md](./zap.md) | OWASP ZAP baseline / API scans |
| [vercel-alerting.md](./vercel-alerting.md) | Vercel logs, notifications, post-deploy checks |
| [alert-routing.md](./alert-routing.md) | GitHub, Snyk, Slack, email |
| [incident-playbook.md](./incident-playbook.md) | Thresholds and response steps |
| [secret-rotation.md](./secret-rotation.md) | When secrets leak — Stripe, Supabase, OAuth |
| [review-checklist.md](./review-checklist.md) | Weekly security review |
| [pr-security-gates.md](./pr-security-gates.md) | PR / release blocking conditions |
| [post-launch-monitoring.md](./post-launch-monitoring.md) | Post-launch detection, response, recovery |
| [security-audit.md](./security-audit.md) | Baseline audit, risks, priorities |
| [env-security.md](./env-security.md) | Secrets and env separation |
| [rls-policies.md](./rls-policies.md) | Row Level Security (when using Supabase) |
| [uploads.md](./uploads.md) | File upload guidance |
| [incident-response.md](./incident-response.md) | Triage, kill switches, rollback |
| [release-security-checklist.md](./release-security-checklist.md) | Pre/post release |
| [testing.md](./testing.md) | Security-focused tests |
| [route-security-checklist.md](./route-security-checklist.md) | Per-domain API review: auth, authz, ownership, RL, tests |
| [ai-and-legal-safety.md](./ai-and-legal-safety.md) | Admin AI + legal review rules |
| [fraud-detection-system.md](./fraud-detection-system.md) | Rule-based fraud signals, policy scores, admin cases, Stripe/Radar hooks |
| [trust-verification-system.md](./trust-verification-system.md) | Platform verification profiles, `platform_trust_scores`, admin queue, ranking hooks |
| [reputation-system.md](./reputation-system.md) | `reputation_scores`, platform reviews/complaints, moderation, ranking hooks |

Related: [../dev/README.md](../dev/README.md) (Vercel deployment safety). CI policy: [../ci-policy.md](../ci-policy.md).
