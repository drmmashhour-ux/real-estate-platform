# LECIPM Platform — Project Overview

LECIPM is a modular marketplace platform for real estate and short-term rentals (BNHub), with broker CRM, analytics, and admin tooling.

## Repo structure

```
lecipm/ (real-estate-platform)
├── apps/
│   ├── web/              # Guest & host web app (skeleton)
│   ├── admin/            # Admin dashboard (skeleton)
│   ├── web-app/          # Main Next.js app (full BNHub + auth + APIs)
│   ├── admin-dashboard/ # Full admin UI
│   ├── owner-dashboard/
│   ├── broker-dashboard/
│   └── mobile-app/
├── services/
│   ├── auth-service/     # Auth (register, login, JWT)
│   ├── user-service/
│   ├── listing-service/
│   ├── search-service/
│   ├── booking-service/
│   ├── payment-service/
│   ├── messaging-service/
│   ├── review-service/
│   ├── bn-hub/           # BNHub service
│   ├── ai/                # AI service (listing, pricing, demand, fraud, support)
│   ├── ai-manager/        # AI Platform Manager (operations layer)
│   ├── ai-operator/       # AI Marketplace Operator (agents, decisions, jobs)
│   └── ...
├── modules/
│   ├── bnhub/            # BNHub module (listings, availability, bookings, reviews)
│   ├── realestate/       # Real estate module
│   ├── crm/              # Broker CRM module
│   └── analytics/        # Analytics module
├── packages/
│   ├── database/        # Shared DB (Prisma schema in web-app for now)
│   ├── config/          # Env, API, logging, security config
│   ├── types/           # Shared TypeScript types
│   ├── utils/           # Shared utilities
│   ├── ui/              # UI components
│   └── api-client/
├── infra/
│   ├── docker/          # Docker notes (see infrastructure/docker)
│   └── scripts/        # Seed, migrate, backup scripts
├── docs/
└── package.json         # Monorepo root
```

## Getting started

- **Run main app:** `npm run dev` (starts apps/web-app).
- **Run admin:** `npm run dev --workspace=apps/admin-dashboard` (or use apps/admin skeleton on port 3002).
- **Run auth service:** `npm run dev:auth`.
- **Database:** Set `DATABASE_URL`; `npm run db:push` to sync schema; `npm run db:seed` to seed.
- **Docker:** `docker compose -f infrastructure/docker/docker-compose.yml up -d` for Postgres.

## Key docs

- [Architecture](ARCHITECTURE-OVERVIEW.md)
- [Services](SERVICE-DESCRIPTIONS.md)
- [API](API-DOCUMENTATION.md)
- [BNHub](BNHUB-MODULE.md)
- [AI-Optimized Architecture](AI-OPTIMIZED-ARCHITECTURE.md) — AI domains, services, endpoints, dashboards
