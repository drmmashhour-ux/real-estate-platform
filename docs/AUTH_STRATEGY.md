# Authentication strategy (web-app)

## Session model

- **Cookie:** `lecipm_guest_id` (exported as `AUTH_SESSION_COOKIE_NAME` in `lib/auth/session-cookie.ts`).
- **Value:** Authenticated `User.id` (httpOnly, set by `/api/auth/login`, `/api/auth/register`, demo session in dev).
- **Role / hub UI:** Optional non-httpOnly `hub_user_role` for hub switching (not the primary auth boundary).

## Route protection

| Layer | Scope | Behavior |
|--------|--------|----------|
| **Proxy** (`proxy.ts`, Next.js 16+) | `/dashboard/**` | No session → redirect to `/auth/login?next=<path+query>`. Sets `x-lecipm-path` on the request for layouts. |
| **Proxy** | `/api/dashboard/**` | No session → `401` JSON `{ "error": "Unauthorized" }`. |
| **Proxy** | `/api/investment-deals/**` | No session → `401` (investment MVP saved deals). |
| **Layout** (`app/(dashboard)/dashboard/layout.tsx`) | All dashboard pages | `requireAuthenticatedUser()` — verifies cookie + `User` row (invalid/tampered id → redirect). |
| **Login redirect** | After sign-in | `auth-login-client` uses `next` or `returnUrl` query param (internal path only). |

## Server / API usage

- **Server Components / Route Handlers:** `getGuestId()` from `lib/auth/session.ts` reads the same cookie (trimmed, non-empty).
- **Explicit guard:** `requireAuthenticatedUser()` in `lib/auth/require-session.ts` for server components.
- **Route Handlers needing `userId`:** `getSessionUserIdFromRequest` / `requireSessionUserIdOr401` in `lib/auth/api-session.ts` (defense in depth for non–`/api/dashboard` routes).

## Out of scope here

- **`/admin/**`** — separate admin checks (often `getGuestId` + role).
- **Public APIs** — unchanged; do not assume session unless documented.
