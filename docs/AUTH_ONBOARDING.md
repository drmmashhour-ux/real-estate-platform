# Authentication & onboarding (LECIPM)

## Implemented today

- **Investors / clients:** `/auth/signup` → full signup (name, email, password, legal); **`/signup`** redirects there (preserves `?ref=`). **Sign in** → `/auth/login` (email + password). After login, routing uses `getDefaultHub()` / `next` query (e.g. `?next=/dashboard`).
- **Mortgage brokers (platform):** `/auth/signup-broker` → broker registration → complete profile at `/broker/complete-profile`. Sign in with `next=/broker/complete-profile` until profile is done.
- **Mortgage experts (lead marketplace):** `/auth/signup-expert` → expert record; login routes to `/dashboard/expert` when terms are accepted (see `auth-login-client.tsx`).

Homepage hero CTAs: **Sign up** → `/auth/signup`, **Sign in** → `/auth/login?next=/dashboard`.

## Product goals (not fully automated in code yet)

These describe the intended experience for **first-time** mortgage brokers and clients:

1. **First sign-in** collects **email** (and password where applicable).
2. **Admin / ops** validates new accounts (e.g. sends or approves a **one-time code** so the sign-in is considered valid).
3. After validation, the user **completes their profile** (broker vs client fields).
4. Only when the profile is **complete** should **dashboard** features be fully available.

To move from “intent” to product:

- Add **email verification** or **magic code** (e.g. Resend + short-lived OTP stored in DB).
- Add **admin notifications** for new signups (existing lead/email hooks may be extended).
- Enforce **profile completion** in **middleware** or **layout** for `/dashboard` and `/broker/*` (redirect to `/broker/complete-profile` or a shared wizard).

Mortgage **experts** (lead marketplace) use `/auth/signup-expert` and are routed to `/dashboard/expert` after login.

Track implementation in product backlog; wire UI entry points from the homepage hero and `/auth/*` routes.
