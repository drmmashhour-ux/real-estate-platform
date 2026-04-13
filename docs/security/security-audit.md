# Security baseline audit

**Scope:** Primary web application `apps/web` (Next.js App Router), Prisma/Postgres, Stripe, session auth, Vercel. Microservices and mobile apps are out of full scope unless shared env applies.

## Surface inventory

| Surface | Location / pattern | Notes |
|---------|---------------------|--------|
| **Auth flows** | `/api/auth/login`, `/api/auth/register`, demo/session routes | Rate limits, IP block, hashed IP hints in logs — no password in logs |
| **Admin routes** | `app/[locale]/[country]/admin/*`, `middleware.ts` | Admin layout checks role; APIs under `/api/admin/*` require session + often cron bearer |
| **Payment routes** | `/api/stripe/*`, webhooks, checkout | Stripe secret server-only; webhook signature verified before handling |
| **Booking routes** | BNHub checkout APIs, booking creation | Business rules + Stripe; assert listing/user ownership where implemented |
| **Document routes** | Legal/deal document APIs | Should enforce deal/participant membership — verify per-route |
| **Messaging routes** | Threads API, guest/host messaging | Enforce thread membership server-side |
| **Upload routes** | FSBO/media, storage presign if any | MIME/size allowlists; see [uploads.md](./uploads.md) |
| **Webhook routes** | Stripe primary; crons with `CRON_SECRET` | Signature or Bearer required |
| **Environment variables** | Vercel + `.env.example` | See [env-security.md](./env-security.md) |
| **Database exposure** | Prisma from server only | No `DATABASE_URL` in client bundles; connection from serverless |

## Critical risks (address first)

1. **Broken access control** — User A accesses User B’s booking, message, or payment by guessing UUIDs. **Mitigation:** Every mutating read/write must filter by `sessionUserId` or explicit membership (deal room, thread). Never `findUnique({ where: { id: clientId } })` without ownership check.
2. **Secret leakage** — Accidental `NEXT_PUBLIC_*` for Stripe secret or service role. **Mitigation:** Grep CI / review; [env-security.md](./env-security.md).
3. **Webhook forgery** — Accepting Stripe events without signature. **Mitigation:** `constructEvent` enforced (`/api/stripe/webhook`).
4. **Credential stuffing** — Mass login attempts. **Mitigation:** Rate limits + IP block (`rate-limit-distributed`).

## Medium risks

- **IDOR on less-used APIs** — CRM, internal tools — require systematic review of each `app/api/**/route.ts`.
- **Verbose errors in production** — Stack traces or Prisma errors to client. **Mitigation:** `safe-error` helper; Next.js production defaults; review `Response.json({ error })`.
- **CSP bypass** — Third-party scripts. **Mitigation:** CSP is `frame-ancestors` only today; tightening full CSP may require nonces — incremental.

## Low risks

- **Analytics spam** — Public track endpoints — rate limits added incrementally (e.g. `/api/experiments/track`).
- **SEO / scraping** — Public listings — business decision on rate limits at edge.

## Remediation priority

1. **P0:** Ownership checks on payment, booking completion, messaging send, deal room mutations.
2. **P1:** Central validators (`lib/security/validators`) on high-traffic POST bodies; expand rate limits on contact/booking/payment creation.
3. **P2:** Admin security dashboard + persisted security events (partially done).
4. **P3:** Full CSP, external WAF, RLS on Supabase if dual-access.

## Related

- [README.md](./README.md)  
- [testing.md](./testing.md)  
