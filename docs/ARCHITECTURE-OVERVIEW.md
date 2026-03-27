# LECIPM Architecture Overview

## High-level

- **Frontend:** Next.js apps (web, admin). Primary implementation: `apps/web` (guests, hosts, BNHub, auth).
- **API:** Next.js API routes in web-app (`/api/*`, `/api/bnhub/*`) act as the main API surface. Standalone services (e.g. auth-service) can run as Express servers and be proxied or called from the app.
- **Database:** PostgreSQL. Prisma schema in `apps/web/prisma`. Shared `packages/database` for connection/config.
- **Modules:** Domain bundles in `modules/*` (bnhub, realestate, crm, analytics) export models, services, routes; the app or API gateway wires them to persistence and HTTP.

## Data flow

1. **Guest/Host:** Browser → Next.js (web-app) → API routes → lib/bnhub or services → Prisma → PostgreSQL.
2. **Admin:** Admin app → same API or admin-specific routes → moderation, fraud, disputes.
3. **Auth:** auth-service (Express) or web-app session (cookie) for identity.

## API gateway

The main API entry is **Next.js app** (`apps/web`). Routes:

- `/api/auth/*` — login, register, session
- `/api/users` — user profile
- `/api/bnhub/listings`, `/api/bnhub/search`, `/api/bnhub/bookings`, `/api/bnhub/messages`, `/api/bnhub/reviews` — BNHub
- `/api/listings`, `/api/search` — unified listings/search
- `/api/admin/*` — admin-only

Standalone services (auth-service, etc.) can be mounted behind a reverse proxy or called internally.

## Scalability

- **Modular services:** Each service (auth, booking, etc.) can be deployed separately.
- **Shared packages:** database, config, types, utils keep contracts consistent.
- **Modules:** Domain logic in `modules/*` stays framework-agnostic and testable.
