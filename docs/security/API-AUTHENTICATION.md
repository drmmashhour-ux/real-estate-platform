# API authentication (LECIPM web app)

## What we use today

The **Next.js web app** authenticates browser clients with an **opaque, httpOnly session cookie** (`lecipm_guest_id`) backed by the database (`createDbSession` / `resolveSessionTokenToUserId`). This is the recommended pattern for same-site web apps: tokens are not exposed to JavaScript, mitigating XSS token theft compared to typical **JWT-in-localStorage** setups.

- **Not used for first-party web UI:** JWT in `Authorization` headers for every page navigation.
- **Used:** Cookie session + server-side role checks (`requireAdminSession`, Prisma `role`, middleware session gates).

### Session lifetime & regeneration

- **Cookie:** `maxAge` 7 days (`lib/auth/session.ts`), aligned with DB `Session.expiresAt` (`lib/auth/db-session.ts`).
- **Regeneration on login:** `createDbSession()` issues a **new opaque token** and **revokes other active sessions** for that user (single active session policy). Password changes / explicit logout should call `revokeDbSessionByToken` where implemented.

### MFA

- **Email OTP:** Users with `twoFactorEmailEnabled` receive a code at login (`/api/auth/login` flow).
- **Admin TOTP:** Placeholder / future work — `lib/auth/totp-scaffold.ts`. Harden admin accounts with email 2FA first, then add TOTP enforcement in layouts or `requireAdminSession` when ready.

### Route handler helper

Use `requireApiSession()` from `lib/auth/require-api-session.ts` inside API routes that need a logged-in user but are not fully covered by middleware — it returns `401` JSON consistent with `getGuestId()` / DB session resolution.

## Machine / cron access

Some automation calls `/api/admin/*` with:

`Authorization: Bearer <CRON_SECRET>`

That secret must be long, random, and stored only in your deployment environment — never in the client.

## Mobile or third-party API consumers

If you add native apps or partner APIs that cannot use cookies, introduce a **dedicated** OAuth2 / JWT **or** API-key flow with:

- Short-lived access tokens
- Refresh rotation
- Per-client rate limits
- Separate audit logging

Do **not** reuse the browser session cookie as a bearer token for third parties.

## Sensitive routes

- **Dashboard HTML:** middleware requires a valid session cookie (`middleware.ts`).
- **Admin HTML:** cookie + hub role cookie gate at the edge; **Prisma `ADMIN` / `ACCOUNTANT`** still enforced in layouts and API handlers.
- **`/api/admin/*`:** session cookie **or** valid `CRON_SECRET` bearer (see `PROD-SECURITY-CHECKLIST.md`).

## Login & registration

- Responses use generic **“Invalid email or password”** for failures (no user enumeration where possible).
- **Rate limits** apply per IP (`/api/auth/login`, `/api/auth/register`); with `REDIS_URL`, limits are **distributed** across instances.
- High-risk **public** POST routes (contact, waitlist, Immo contact, buyer listing contact, password reset) use `gateDistributedRateLimit()` from `lib/rate-limit-enforcement.ts` — same Redis-backed limiter + optional `RATE_LIMIT_IP_BLOCK` cooldown as auth routes.
- Successful logins can emit structured security logs and `platformEvent` rows — see `lib/observability/security-events.ts`.
