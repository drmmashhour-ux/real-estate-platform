# Roles & permissions (technical)

## Prisma `PlatformRole`

Canonical roles live in the database schema (`User.role`). Typical values include:

- `USER` — authenticated default
- `HOST` — BNHub host capabilities
- `BROKER` — residential brokerage
- `ADMIN` — platform administrator
- Additional roles as defined in Prisma (e.g. mortgage expert) — check `schema.prisma`

“**Guest**” is usually **unauthenticated** (no session), not a stored role.

## Code entry points

- **Web session:** `apps/web/lib/auth/session.ts`, `getGuestId`, cookies
- **API JSON guards:** various `require*` helpers under `apps/web/lib/auth/`, `lib/oaciq/`, `lib/bnhub/`, etc.
- **Central facade (v1):** `apps/web/lib/access-control.ts` — re-exports role type and small helpers; **does not replace** existing route-specific guards in one pass.

## Founder / investor

Executive and founder surfaces often require **platform scope** (see `modules/owner-access/`, `lib/launch-investor-api-auth.ts`). Treat as **higher trust** than normal broker.

## Feature flags

Authorization is **role + flag**: enable the surface in `config/feature-flags.ts` before exposing new UI or API.

## Operational doc

Org roles (founder, engineer, …) are described in [roles.md](roles.md) (people/process), not RBAC.
