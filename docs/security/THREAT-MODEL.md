# Threat model — LECIPM web (Phase 1 summary)

## Assets

- User accounts, sessions, PII (email, phone, messages).
- Financial: Stripe payments, BNHub bookings, payouts.
- Admin operations: moderation, payouts, configuration.
- AI: prompts may contain PII — treat as sensitive data in logs.

## Trust boundaries

| Boundary | Trust assumption |
|----------|------------------|
| Browser | Untrusted; any cookie/header can be forged client-side for non-httpOnly values. |
| Next.js server | Trusted; enforces authz with Prisma role checks. |
| Vercel Edge middleware | Trusted; coarse gates only—**not** a substitute for server authz. |
| Stripe webhooks | Trusted only after `constructEvent` succeeds. |
| Database | Trusted if `DATABASE_URL` is secret; app uses parameterized Prisma. |

## Primary threats & mitigations

1. **Session hijacking / fixation** — HTTPS, httpOnly session cookie, SameSite; short session TTL (future tightening).
2. **Privilege escalation** — Admin routes: middleware cookie check + `requireAdminSession` / Prisma `role === ADMIN`.
3. **CSRF on cookie-auth POST** — SameSite=Lax reduces risk; state-changing APIs should prefer same-site or CSRF token (future for highly sensitive forms).
4. **Credential stuffing** — Rate limits on login/register; consider CAPTCHA on signup (hook points in checklist).
5. **Webhook replay / forgery** — Stripe signature verification; idempotency via `stripeEventId` / inbox patterns in webhook handler.
6. **Injection** — Prisma parameterized queries; avoid `$queryRawUnsafe` with user input (audit ongoing).
7. **File upload abuse** — MIME/size allowlists; sanitize stored filenames.
8. **Secret leakage** — No secrets in logs; staged-file scan; env validation at startup.

## Out of scope (Phase 1)

- WAF / bot management at edge (Cloudflare, etc.).
- Full CSP with nonces for all inline scripts.
- Hardware security modules for key storage.

## Review cadence

Revisit after major features touching auth, payments, or uploads.
