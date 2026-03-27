# LECIPM Build Readiness Checklist

Use this checklist to confirm the platform is ready to begin (or continue) development. Tick items when satisfied.

---

## Repository & environment

- [ ] **Repository initialized** — Git repo exists; remotes configured; branch strategy clear (e.g. `main` + feature branches).
- [ ] **Dependencies install** — `npm install` (or pnpm) runs successfully from repo root.
- [ ] **Environment config** — `.env.example` (or equivalent) documents required vars (e.g. `DATABASE_URL`); local `.env` or secrets available for dev.

---

## Documentation

- [ ] **Documentation organized** — Docs live under `docs/` with structure: `vision/`, `architecture/`, `product/`, `engineering/`, `operations/`, `ai/`, `defense/`, `launch/` (and `api/` as needed).
- [ ] **Master index available** — [docs/architecture/master-index.md](architecture/master-index.md) links to major architecture docs and reading order.
- [ ] **Developer onboarding** — [docs/DEVELOPER-ONBOARDING.md](DEVELOPER-ONBOARDING.md) explains purpose, structure, run instructions, and how to add modules.
- [ ] **Modules registry** — [docs/architecture/MODULES-REGISTRY.md](architecture/MODULES-REGISTRY.md) lists major modules with purpose, location, APIs, dependencies.

---

## Service scaffolding

- [ ] **Primary app runs** — `npm run dev` (or equivalent) starts the main app (e.g. Next.js web app on port 3000).
- [ ] **Service scaffolding ready** — Apps and services folders exist; each has a README and can be started or extended (e.g. `apps/web`, `services/auth-service`).
- [ ] **Workspaces configured** — Root `package.json` defines workspaces (`apps/*`, `packages/*`, `services/*` or similar).

---

## Database

- [ ] **Database schema defined** — Prisma schema (or equivalent) exists and is the source of truth for core entities (e.g. `apps/web/prisma/schema.prisma`).
- [ ] **Migrations / db push** — `npx prisma db push` or `prisma migrate` runs successfully against a dev database.
- [ ] **Seeding (optional)** — Seed script exists and can populate dev data (`npx prisma db seed`).

---

## API

- [ ] **API blueprint defined** — [API Architecture Blueprint](architecture/LECIPM-API-ARCHITECTURE-BLUEPRINT.md) (or equivalent) describes endpoints and patterns.
- [ ] **API standards documented** — [API Standards](api/API-STANDARDS.md) (or equivalent) cover errors, auth, versioning.
- [ ] **Critical routes implemented** — Core flows (e.g. auth, listings, bookings, payments, admin/defense) have corresponding API routes.

---

## Frontend

- [ ] **Frontend architecture defined** — [Frontend Architecture Blueprint](architecture/LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md) describes app structure, routing, state.
- [ ] **Design system defined** — [Design System Blueprint](architecture/LECIPM-DESIGN-SYSTEM-BLUEPRINT.md) covers components, tokens, patterns.
- [ ] **Design-to-code guide** — [Design-to-Code Implementation Guide](architecture/LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md) (or equivalent) helps translate design into code.

---

## Implementation plan

- [ ] **Build order defined** — [Build Order](engineering/LECIPM-BUILD-ORDER.md) (or equivalent) outlines phased implementation.
- [ ] **Task map available** — [Engineering Task Map](engineering/LECIPM-ENGINEERING-TASK-MAP.md) breaks down work into implementable tasks.
- [ ] **Sprint plan (optional)** — [Development Sprint Plan](engineering/LECIPM-DEVELOPMENT-SPRINT-PLAN.md) aligns tasks with sprints.
- [ ] **Cursor / AI execution guide** — [Cursor Execution Mode Guide](engineering/LECIPM-CURSOR-EXECUTION-MODE-GUIDE.md) explains how to use Cursor for code generation.

---

## Optional but recommended

- [ ] **Linting & formatting** — ESLint and Prettier (or equivalent) run from root; CI or pre-commit runs them.
- [ ] **Tests** — At least one passing test suite (e.g. `npm run test` in web-app or root); critical paths (auth, booking, defense) have some coverage.
- [ ] **Infrastructure** — Docker Compose (or similar) for local Postgres/stack; deployment path documented.

---

## Sign-off

When the above are satisfied, the platform is **ready to begin development** (or continue with the next phase from the build order). Revisit this checklist when onboarding new engineers or AI coding tools.

- **Date:** _________________
- **Reviewed by:** _________________
