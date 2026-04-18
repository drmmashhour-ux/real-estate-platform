# API normalization (v1 target)

## Current state

The monorepo has grown with multiple naming styles: `/api/bnhub/*`, `/api/deals/*`, `/api/mobile/*`, `/api/founder/*`, etc. **All remain supported.**

## Target convention

```
/api/{domain}/{resource}/[id]/.../route.ts
```

- **domain**: `bnhub` | `brokerage` | `deals` | `pricing` | `growth` | `founder` | `mobile` | `admin` | …
- **resource**: plural noun where practical (`listings`, `bookings`, `deals`)

Handlers should:

1. Authenticate (session / bearer / internal secret).
2. Check feature flags when rollout is gated.
3. Delegate to `modules/<domain>/…/*.service.ts`.
4. Return JSON using `jsonSuccess` / `jsonFailure` from `@/lib/api-response` (or legacy `{ error }` only where clients still depend on it).

## Thin controllers

Route files should not contain:

- pricing formulas
- multi-step Prisma transactions without a service
- email/push side effects without a service or job

## Duplication

Before adding a second route for the same behavior, search `apps/web/app/api` and extend or compose services.

## See also

- [API-DOCUMENTATION.md](../API-DOCUMENTATION.md)
- [../architecture/LECIPM-ARCHITECTURE-V1-PRODUCTION.md](../architecture/LECIPM-ARCHITECTURE-V1-PRODUCTION.md)
