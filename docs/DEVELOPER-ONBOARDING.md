# LECIPM Developer Onboarding Guide

This guide helps new engineers and AI coding tools get oriented and start contributing to the LECIPM platform.

---

## 1. Project purpose

LECIPM is a **global real estate, accommodation, and investment ecosystem** that connects:

- **Users** — Guests, hosts, buyers, renters, brokers, owners, investors  
- **Properties** — Listings for sale, long-term rental, short-term rental (BNHub), and investment deals  
- **Services** — Marketplace, broker CRM, BNHub short-term rentals, owner dashboard, deal marketplace, investment analytics, trust & safety, AI Control Center, admin tools  

The platform is built for **trust, verification, multi-market expansion, and AI-assisted operations**. It is an ecosystem, not just a single marketplace.

**Key docs:** [Project Overview](vision/PROJECT-OVERVIEW.md), [Platform Mission](vision/PLATFORM-MISSION.md).

---

## 2. Architecture overview

- **Monorepo** — Apps, services, and shared packages live in one repo (npm/pnpm workspaces).
- **Primary app** — Next.js web app in `apps/web-app` (SSR, API routes, BNHub, marketplace, admin).
- **Services** — Auth, user, listing, search, booking, payment, messaging, review, trust-safety, analytics, etc. (some logic is in web-app; services can be split out later).
- **Shared packages** — UI components, API client, design tokens, shared utils, auth, database.
- **Layers** — Operational controls, observability, policy engine, revenue/growth, AI Operating System, Platform Defense Layer.

**Key docs:** [Master Index](architecture/master-index.md), [Architecture Diagram](architecture/ARCHITECTURE-DIAGRAM.md), [Platform Modules Registry](architecture/MODULES-REGISTRY.md).

---

## 3. Repo structure

```
/
├── apps/
│   ├── web-app/              # Main Next.js app (marketplace, BNHub, admin, API routes)
│   ├── admin-dashboard/       # Standalone admin (placeholder)
│   ├── broker-dashboard/      # Broker CRM app (placeholder)
│   ├── owner-dashboard/       # Owner app (placeholder)
│   └── mobile-app/            # Mobile (placeholder)
├── packages/
│   ├── ui-components/        # Shared React components
│   ├── api-client/            # API client
│   ├── design-tokens/         # Design tokens
│   ├── shared-utils/          # Shared utilities
│   ├── ui/, auth/, api/, database/  # Additional shared packages
│   └── ...
├── services/
│   ├── auth-service/          # Auth microservice
│   ├── user-service/          # User service
│   ├── listing-service/       # Listings
│   ├── booking-service/       # Bookings
│   ├── payment-service/       # Payments
│   ├── messaging-service/    # Messaging
│   ├── review-service/       # Reviews
│   ├── trust-safety/          # Trust & safety
│   ├── analytics-service/    # Analytics
│   ├── bn-hub/                # BNHub logic (also in web-app)
│   ├── broker-crm/            # Broker CRM
│   └── ai-control-center/     # AI Control Center
├── infrastructure/
│   ├── docker/                # Docker Compose (e.g. Postgres)
│   ├── database/              # DB configs
│   └── deployment/            # Deployment configs
└── docs/                      # All documentation
    ├── vision/
    ├── architecture/
    ├── product/
    ├── engineering/
    ├── operations/
    ├── ai/
    ├── defense/
    ├── launch/
    ├── api/
    └── ...
```

**Key doc:** [README](../README.md) at repo root.

---

## 4. How to run services locally

### Prerequisites

- **Node.js** ≥ 20  
- **npm** (or pnpm)  
- **PostgreSQL** (local or Docker)  
- **Git**

### Quick start (web app only)

From **repository root**:

```bash
npm install
cp .env.example .env   # edit DATABASE_URL if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

**Option A — Local Postgres**

1. Set `DATABASE_URL` in `apps/web-app/.env` (or root `.env`).
2. From repo root or `apps/web-app`:

```bash
cd apps/web-app
npx prisma db push
npx prisma db seed
```

**Option B — Docker Postgres**

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
# Set DATABASE_URL=postgresql://lecipm:lecipm@localhost:5432/lecipm in apps/web-app/.env
cd apps/web-app && npx prisma db push && npx prisma db seed
```

### Running individual services

- **Web app:** `npm run dev` (root) or `cd apps/web-app && npm run dev` (port 3000).
- **Auth service:** `npm run dev:auth` or `cd services/auth-service && npm run dev` (port 3001).
- **Other services:** See root [README](../README.md) and each service’s `README.md` for ports (e.g. booking 3005, payment 3006).

**Key doc:** [Development Setup](engineering/DEVELOPMENT-SETUP.md).

---

## 5. How to generate code with Cursor

- **Read first:** [LECIPM Cursor Execution Mode Guide](engineering/LECIPM-CURSOR-EXECUTION-MODE-GUIDE.md).
- **Reference while coding:**
  - Data: `apps/web-app/prisma/schema.prisma`, [Database Schema Blueprint](architecture/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md).
  - APIs: [API Architecture Blueprint](architecture/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [API Standards](api/API-STANDARDS.md).
  - UI: [Design System](architecture/LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [Design-to-Code Guide](architecture/LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md).
- **Module boundaries:** [Platform Modules Registry](architecture/MODULES-REGISTRY.md).
- **Build order:** [Build Order](engineering/LECIPM-BUILD-ORDER.md).

Use clear prompts that reference these docs (e.g. “Add API per API blueprint and Prisma schema”) so generated code stays consistent.

---

## 6. How to add new modules

1. **Decide placement** — New feature in `apps/web-app` vs new service in `services/` vs new package in `packages/`. Prefer extending the web app for product features unless you need a separate process.
2. **Data** — Add or extend models in `apps/web-app/prisma/schema.prisma`; run `npx prisma generate` and migrations as needed.
3. **API** — Add routes under `apps/web-app/app/api/` (e.g. `app/api/my-module/route.ts`). Follow [API Standards](api/API-STANDARDS.md).
4. **UI** — Add pages under `apps/web-app/app/` and reuse components from `apps/web-app/components/` or `packages/ui-components/`.
5. **Docs** — Update [Platform Modules Registry](architecture/MODULES-REGISTRY.md) and relevant architecture docs.
6. **Tests** — Add unit/integration tests next to the code or in `__tests__`; e.g. `apps/web-app/lib/**/__tests__/*.test.ts`.

---

## 7. Coding standards

- **TypeScript** — Strict mode; prefer types/interfaces for public contracts.
- **API** — REST or RPC-style routes; JSON; consistent error shape (`{ error: string }`); use [API Standards](api/API-STANDARDS.md).
- **Naming** — camelCase (code), kebab-case (routes, files where convention uses it), PascalCase (components, types).
- **Formatting** — Prettier (run `npm run format` from root).
- **Linting** — ESLint (run `npm run lint` / `npm run lint:fix`).
- **Imports** — Prefer `@/` path aliases in web-app (e.g. `@/lib/db`, `@/components/...`).
- **Clean architecture** — Keep UI, API, and domain/data layers clearly separated; avoid business logic in route handlers where possible.

---

## 8. Testing expectations

- **Unit tests** — For libs, utilities, and domain logic (e.g. `apps/web-app/lib/defense/__tests__/`).
- **API tests** — For critical routes (e.g. booking, auth, defense APIs).
- **Run tests:** From root `npm run test`, or from `apps/web-app`: `npm run test`, optionally with path: `npm run test -- --run lib/defense/__tests__`.
- **Coverage** — Aim to add tests for new defense, payment, and enforcement logic; policy acceptance; evidence and audit flows.

**Key doc:** [Build Order](engineering/LECIPM-BUILD-ORDER.md) and task map for test requirements per feature.

---

## Next steps

- **New to the repo:** Read [Project Overview](vision/PROJECT-OVERVIEW.md) and [Master Index](architecture/master-index.md).
- **Implementing features:** Use [Build Order](engineering/LECIPM-BUILD-ORDER.md) and [Modules Registry](architecture/MODULES-REGISTRY.md).
- **Using Cursor:** Follow [Cursor Execution Guide](engineering/LECIPM-CURSOR-EXECUTION-MODE-GUIDE.md).
- **Launch readiness:** Use [Build Readiness Checklist](BUILD-READINESS-CHECKLIST.md).
