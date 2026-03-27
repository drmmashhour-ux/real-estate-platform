# LECIPM Platform

Monorepo for the LECIPM real-estate ecosystem: marketplace, BNHub short-term rentals, broker/owner tools, trust & safety.

---

## Monorepo layout

| Area | Contents |
|------|----------|
| **apps/** | `web-app`, `admin-dashboard`, `broker-dashboard`, `owner-dashboard`, `mobile-app` |
| **services/** | `auth-service`, `user-service`, `listing-service`, `search-service`, `booking-service`, `payment-service`, `messaging-service`, `review-service`, `trust-safety` |
| **packages/** | `ui-components`, `api-client`, `design-tokens`, `shared-utils` (+ `ui`, `auth`, `api`, `database`) |
| **infrastructure/** | `docker`, `database`, `deployment` |
| **docs/** | Architecture, API, product docs |

Workspaces are defined in root `package.json` (`apps/*`, `packages/*`, `services/*`). Node ≥20.

---

## Quick start

From the **repository root**:

```bash
npm install
cp .env.example .env   # optional; edit per app/service
npm run dev
```

Opens the web app at [http://localhost:3000](http://localhost:3000).

### Database (web-app + BNHub)

```bash
# Option A: local Postgres — set DATABASE_URL in apps/web-app/.env
cd apps/web-app && npx prisma db push && npx prisma db seed

# Option B: Docker Postgres
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
# Then set DATABASE_URL=postgresql://lecipm:lecipm@localhost:5432/lecipm in apps/web-app/.env
cd apps/web-app && npx prisma db push && npx prisma db seed
```

---

## Development commands

### Root (from repo root)

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start web-app dev server |
| `npm run dev:web` | Same as `npm run dev` (web-app) |
| `npm run dev:auth` | Start auth-service (port 3001) |
| `npm run build` | Build all workspaces that define `build` |
| `npm run build:web` | Build web-app only |
| `npm run start` | Start web-app production server |
| `npm run lint` | Run ESLint (packages + services; apps use their own) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier format all supported files |
| `npm run format:check` | Prettier check only |
| `npm run db:push` | Prisma db push (web-app) |
| `npm run db:seed` | Prisma seed (web-app) |
| `npm run docker:build` | Build images (docker-compose) |
| `npm run docker:up` | Start Docker stack (e.g. Postgres) |
| `npm run docker:down` | Stop Docker stack |
| `npm run test` | Run tests in all workspaces that define `test` |
| `npm run test:auth` | Run auth-service tests only |

### Per app / service

- **Web app:** `cd apps/web-app` → `npm run dev` | `npm run build` | `npm run start`
- **Auth service:** `cd services/auth-service` → `npm run dev` (port 3001), `npm run test`, `npm run db:generate`
- **Other services:** Each has `npm run dev`, `npm run build`; see service `README.md` for ports (e.g. booking 3005, payment 3006, messaging 3007, review 3008, trust-safety 3009).
- **Placeholder apps:** `admin-dashboard` (port 3010), `broker-dashboard` (3011), `owner-dashboard` (3012), `mobile-app` (3013) — static login + dashboard; set `window.API_URL` to auth base URL.

---

## TypeScript

- **Root:** `tsconfig.base.json` — shared compiler options for the monorepo.
- **Apps/services:** Extend base or define their own (e.g. Next.js in `apps/web-app`, ESM in `services/auth-service`).

---

## Linting and formatting

- **ESLint:** Root `eslint.config.mjs` (TypeScript). Applied to `packages/*` and `services/*`; `apps/*` excluded so Next/React apps keep their own config.
- **Prettier:** Root `.prettierrc` and `.prettierignore`. Run `npm run format` or `npm run format:check`.

---

## Environment variables

- **Root:** `.env.example` lists common vars (e.g. `DATABASE_URL`, auth placeholders). Copy to `.env` and fill as needed.
- **Per app/service:** Each app or service can have its own `.env` (e.g. `apps/web-app/.env`, `services/auth-service/.env`). See the README in that folder for required variables.

---

## Docker

- **Compose:** `infrastructure/docker/docker-compose.yml` — Postgres 16; optional auth-service (commented). From root:
  ```bash
  docker compose -f infrastructure/docker/docker-compose.yml up -d
  ```
- **Service images:** Each service under `services/*` has a `Dockerfile`. Build from **service directory** (or from root with context). Example (auth-service):
  ```bash
  docker build -t lecipm/auth-service ./services/auth-service
  docker run -p 3001:3001 -e DATABASE_URL=... -e JWT_ACCESS_SECRET=... lecipm/auth-service
  ```
- **Generic template:** `infrastructure/docker/Dockerfile.service` — reference for adding new Node services.

---

## Main routes (web-app)

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/bnhub` | Short-term rentals (search, book, pay) |
| `/bnhub/login` | Demo sign-in for booking |
| `/bnhub/host/dashboard` | Host dashboard |
| `/marketplace`, `/properties` | Marketplace listings |
| `/broker`, `/owner`, `/admin` | Dashboards (placeholders) |
| `/about-platform`, `/contact` | Info pages |

---

## Initial working flow

The platform supports this first operational flow:

1. **User registers** → auth-service `POST /v1/auth/register`
2. **User logs in** → auth-service `POST /v1/auth/login`
3. **Host creates listing** → listing-service `POST /v1/properties` or web-app BNHub flow
4. **Guest searches** → search-service `GET /v1/search/properties` or web-app `/bnhub`
5. **Guest books stay** → booking-service `POST /v1/bookings`
6. **Guest pays** → payment-service `POST /v1/payments/intent` + `POST /v1/payments/confirm`
7. **Host receives booking** → booking-service `GET /v1/bookings/:id`
8. **Users communicate** → messaging-service `GET/POST /v1/conversations`, `POST /v1/conversations/:id/messages`
9. **Guest leaves review** → review-service `POST /v1/reviews`
10. **Trust & safety** → trust-safety `POST /v1/incidents`, `POST /v1/flags`, `POST /v1/suspensions`

See [docs/engineering/DEVELOPMENT-SETUP.md](docs/engineering/DEVELOPMENT-SETUP.md) for full setup and running all services.

---

## Documentation

The **LECIPM Project Architecture Workspace** lives in `docs/`:

- [docs/README.md](docs/README.md) — Documentation hub and structure
- [docs/DEVELOPER-ONBOARDING.md](docs/DEVELOPER-ONBOARDING.md) — Developer onboarding (run locally, add modules, standards, testing)
- [docs/architecture/master-index.md](docs/architecture/master-index.md) — Master index of all architecture docs (reading order)
- [docs/architecture/MODULES-REGISTRY.md](docs/architecture/MODULES-REGISTRY.md) — Platform modules: purpose, location, APIs, dependencies
- [docs/architecture/ARCHITECTURE-DIAGRAM.md](docs/architecture/ARCHITECTURE-DIAGRAM.md) — High-level architecture diagram
- [docs/BUILD-READINESS-CHECKLIST.md](docs/BUILD-READINESS-CHECKLIST.md) — Build readiness checklist

Other key docs: [Development Setup](docs/engineering/DEVELOPMENT-SETUP.md), [Project Overview](docs/vision/PROJECT-OVERVIEW.md), [Build Order](docs/engineering/LECIPM-BUILD-ORDER.md), [API Architecture](docs/architecture/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [API Standards](docs/api/API-STANDARDS.md).
