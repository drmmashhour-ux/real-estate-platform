# LECIPM Platform — Cursor Execution Mode Guide

**Practical guide for using Cursor to build the LECIPM platform step-by-step**

This document explains how to use **Cursor** (AI-assisted development) to convert LECIPM architecture documents into working software. It defines development philosophy, repository layout, backend and frontend sequences, database and API implementation, component library, feature-by-feature execution, testing, debugging, CI/CD, security, performance, documentation, and launch preparation. Use this guide so Cursor generates code in the right order, in small modules, with tests, without generating the whole platform at once. It aligns with the [Build Order](LECIPM-BUILD-ORDER.md), [System Map](LECIPM-SYSTEM-MAP.md), [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [Design System Blueprint](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), and [Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md).

---

## 1. Cursor development philosophy

### How Cursor should approach development

| Principle | Application |
|-----------|-------------|
| **Build vertically (feature by feature)** | Complete one feature end-to-end (e.g. “user registration” or “create listing”) before starting the next. That means: DB model → API → frontend → tests for that feature. Do not implement all backend services then all frontend; do not implement all pages without APIs. |
| **Respect the build order** | Follow [LECIPM-BUILD-ORDER.md](LECIPM-BUILD-ORDER.md) strictly. Phase 1 (infrastructure) before Phase 2 (users); Phase 2 before Phase 3 (listings); listings before search; search before booking; booking before payment; and so on. When asked to “build X,” check the build order: if X depends on Y, generate Y first or assume Y exists. |
| **Generate small modules** | One migration per logical table group; one API route file or controller per resource; one component per UI element. Avoid single files with hundreds of lines. Prefer many small files that are easy to change and test. |
| **Test continuously** | Add at least one test (unit or API) per new endpoint or critical function. Run tests after each generated chunk. Do not generate a full phase without tests and then add them later; tests should be part of the same edit session or the next. |
| **Avoid generating the whole platform at once** | Never prompt “build the entire LECIPM platform.” Always scope: “implement Phase 2 user registration API,” “add the listing card component,” “add migration for bookings table.” Large prompts lead to incomplete or inconsistent output; small prompts allow verification and iteration. |
| **Keep services modular** | Backend: one service or module per domain (user, auth, listing, booking, payment, etc.). Frontend: `ui/` for primitives, `shared/` for cross-feature components, `features/<domain>/` for domain UI. Do not put booking logic inside the user service; do not put payment logic inside the listing component. |

### Reference documents Cursor must use

- **Build order and sequence:** [LECIPM-BUILD-ORDER.md](LECIPM-BUILD-ORDER.md) — phases and task order.
- **System overview:** [LECIPM-SYSTEM-MAP.md](LECIPM-SYSTEM-MAP.md) — users, apps, modules, services, data flow.
- **Concrete tasks:** [LECIPM-ENGINEERING-TASK-MAP.md](LECIPM-ENGINEERING-TASK-MAP.md) — task IDs and descriptions.
- **Data model:** [LECIPM-DATABASE-SCHEMA-BLUEPRINT.md](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) — tables, columns, relationships.
- **API contract:** [LECIPM-API-ARCHITECTURE-BLUEPRINT.md](LECIPM-API-ARCHITECTURE-BLUEPRINT.md) — endpoints, request/response, auth.
- **Frontend structure:** [LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md) — apps, pages, layouts.
- **UI and tokens:** [LECIPM-DESIGN-SYSTEM-BLUEPRINT.md](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md) — components, tokens, patterns.
- **Product behavior:** [LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md) — what the product should do.

When generating code, Cursor should read the relevant section of these docs (e.g. “Phase 2” and “users table” and “POST /auth/register”) and produce code that matches. If a doc says “return 403 when role missing,” the generated code must enforce that.

---

## 2. Repository initialization

### Project structure to create first

Initialize the repository with the following layout. Do not fill everything at once; create folders and minimal entrypoints so that backend and frontend can be added incrementally.

```
lecipm-platform/
  apps/
    web-app/                 # Main web app (marketing + authenticated app)
    admin-app/               # Admin console (optional separate app)
  packages/
    api/                     # Shared API client, types, constants
    ui/                      # Shared design system components (optional package)
  services/
    gateway/                 # API gateway or BFF (if used)
    user-service/
    auth-service/
    listing-service/
    search-service/
    booking-service/
    payment-service/
    messaging-service/
    notification-service/
    review-service/
    trust-safety-service/
    admin-service/
  libs/
    db/                      # Database client, migrations, shared models
    config/                  # Shared config and env
    logger/                  # Shared logging
  infrastructure/
    terraform/               # Or CloudFormation, Pulumi
    docker/
    ci/
  docs/                      # Architecture docs (already present)
```

### Backend services folder

- Each service under `services/<name>/` has: `src/` (or equivalent), entrypoint (e.g. `main.ts` or `index.js`), package/manifest, tests folder. Start with one service (e.g. `user-service`) and add others per build order. Shared code (DB client, config, logger) lives in `libs/` and is imported by services.

### Frontend apps folder

- `apps/web/` contains the main web application: public pages, authenticated app, marketplace, BNHub, host/owner/broker dashboards. Structure per [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md): `app/` or `pages/`, `features/`, `shared/`, `ui/`, `styles/`. Initialize with router, auth provider, and API client placeholder; add screens and features per build order.

### Shared libraries folder

- `packages/api/`: API base URL, fetch wrapper, auth header injection, response/error types. Used by all frontend apps and optionally by services calling each other.
- `libs/db/`: Database connection, migration runner, shared schema types. Used by all services that touch the DB.
- `libs/config/`, `libs/logger/`: Environment and logging used by all services.

### Infrastructure folder

- `infrastructure/`: IaC for cloud resources (VPC, DB, storage, compute), Dockerfiles for services, CI config (build, test, deploy). Add in Phase 1; extend when adding new services or environments.

### Documentation folder

- `docs/` already holds the architecture documents. When generating code, Cursor should not duplicate full docs here; it may add short `README.md` per service or app describing how to run and test, and update API or schema docs when contracts change.

---

## 3. Backend development sequence

### Order in which Cursor should implement backend systems

Follow the [Build Order](LECIPM-BUILD-ORDER.md) phases. Within backend, implement in this order:

| Order | Service / system | Why this order |
|-------|-------------------|----------------|
| 1 | **User service** | All other services need “current user” and roles. User CRUD and profile are the base. |
| 2 | **Authentication system** | Login, tokens, RBAC. Listing and booking APIs require auth; no feature work without it. |
| 3 | **Listing service** | Listings are the core entity for marketplace and BNHub. Search and booking depend on listing id and fields. |
| 4 | **Search service** | Discovery depends on listing data. Search index is fed by listing events; booking flow starts from search results. |
| 5 | **Booking service** | BNHub core flow. Depends on listing and availability; payment captures for a booking. |
| 6 | **Payment service** | Booking confirmation and host payouts depend on payment. Must integrate with provider and respect idempotency. |
| 7 | **Messaging service** | Guest–host and broker–client communication. Depends on user and optionally booking (thread per booking). |
| 8 | **Review service** | Depends on booking (post-stay) and user. Listing and user aggregates depend on reviews. |
| 9 | **Trust and safety service** | Incidents, disputes, verification status. Depends on user, listing, booking, payment. Protects platform before scaling. |
| 10 | **Admin service** | Moderation, user/listings/bookings/payments read, incidents, disputes, audit. Depends on all of the above. |

### Implementation rules per service

- **One service per folder** under `services/`; clear boundary. Shared DB and config from `libs/`.
- **API contract** from [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md): path, method, body, response, auth. Generate route handlers and validation to match.
- **Database** access via shared client; tables created by migrations in `libs/db/` or per-service migrations that run in order. Do not create tables in random order; follow [Database implementation order](#4-database-implementation-order) below.
- **Events** (e.g. BookingConfirmed, ListingCreated): publish to event bus or call search/notification from within the same phase. Document what each service publishes and consumes.

When asked to “implement the booking service,” Cursor should: (1) add booking-related tables if not present; (2) implement booking creation, get, list, cancel APIs; (3) integrate with availability and payment per blueprint; (4) add tests for happy path and validation. It should not implement payment provider logic inside the booking service; it should call the payment service or shared payment client.

---

## 4. Database implementation order

### Sequence for creating tables

Create migrations in this order so that foreign keys and dependencies are satisfied. Match table and column names to [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md).

| Order | Table(s) | Depends on | Purpose |
|-------|----------|------------|---------|
| 1 | `users` | — | Identity for all roles. |
| 2 | `user_roles`, `user_profiles` (optional) | users | Roles and profile extensions. |
| 3 | Verification-related (e.g. verification status on users or separate table) | users | Identity verification state. |
| 4 | `listings` | users | Properties and BNHub listings. |
| 5 | `listing_media`, `listing_amenities`, `listing_availability` | listings | Media, amenities, calendar. |
| 6 | `bookings` | users, listings | Reservations. |
| 7 | `payments` | bookings, users | Guest charges. |
| 8 | `payouts`, `payout_items` or equivalent | users, payments | Host payouts. |
| 9 | `refunds` | payments | Refund records. |
| 10 | `threads`, `thread_participants`, `messages` | users, optional bookings | Messaging. |
| 11 | `reviews`, `listing_aggregates` (or computed) | users, listings, bookings | Reviews and ratings. |
| 12 | `incidents` | users, optional listings/bookings | Trust & Safety incidents. |
| 13 | `disputes` | users, bookings, payments | Disputes and resolution. |
| 14 | `deals`, `deal_interests` | users | Deal marketplace. |
| 15 | Analytics/market/portfolio tables (optional) | listings, bookings, payments | Aggregates for dashboards. |
| 16 | `audit_logs`, `notifications`, `notification_preferences` | users | Audit and notifications. |

### Migration strategy

- **One migration file per logical step** (e.g. `001_users.sql`, `002_listings.sql`). Use a migration runner (e.g. Flyway, Prisma migrate, Alembic) and never edit a migration that has already run in shared environments.
- **Idempotency:** Migrations should be safe to run multiple times where possible (e.g. “CREATE TABLE IF NOT EXISTS” or “ADD COLUMN IF NOT EXISTS” if supported), or run once and never change.
- **Rollback:** Document or provide down migrations for local/dev; production rollbacks are rare and require care with data.
- When adding a new feature, Cursor should add a new migration file that creates or alters only the tables needed for that feature, and run it after existing migrations.

---

## 5. API implementation strategy

### Rules for implementing APIs

| Rule | Application |
|------|-------------|
| **Implement APIs per module** | Group routes by domain: `/auth/*`, `/users/*`, `/listings/*`, `/bookings/*`, `/payments/*`, etc. One router or controller per resource; do not mix listing and booking in one file. |
| **Validate inputs strictly** | Use schema validation (Zod, Joi, or OpenAPI-driven) for every request body and query. Return 400 with a consistent error shape when validation fails. Per [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md): error code, message, details array. |
| **Return consistent response structures** | Success: `{ data }` or `{ data, pagination }` for lists. Error: `{ error: { code, message, details?, requestId? } }`. Same shape across all endpoints. |
| **Implement pagination and filtering** | List endpoints accept `page`, `pageSize` (or `limit`), and filter params (e.g. `status`, `userId`). Return `pagination: { page, pageSize, totalCount, hasMore }`. Use defaults (e.g. pageSize 20, max 100). |
| **Follow role-based access rules** | Per [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md) and [Build Order](LECIPM-BUILD-ORDER.md): require auth for protected routes; require role (e.g. host, admin) where specified. Return 401 when unauthenticated and 403 when unauthorized. Check resource ownership (e.g. listing belongs to current user) before allowing update/delete. |

### Idempotency

- For POST that create payments, refunds, or bookings, support `X-Idempotency-Key` header. Store key and result; on duplicate key with same body return same result; on duplicate key with different body return 409. Per API blueprint.

### Versioning

- Prefix routes with `/v1/` (or similar). When generating a new endpoint, place it under the existing version; do not introduce a new version without a documented reason.

---

## 6. Frontend development sequence

### Order in which Cursor should implement frontend

Follow [Build Order](LECIPM-BUILD-ORDER.md) and [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md). Recommended order:

| Order | Frontend area | Backend dependency | Purpose |
|-------|----------------|--------------------|---------|
| 1 | **Authentication screens** | User + Auth APIs | Sign up, login, logout, forgot password. Required for all protected flows. |
| 2 | **Marketplace search pages** | Search + Listing APIs | Search results, filters, map. Entry point for discovery. |
| 3 | **Listing detail pages** | Listing + Review APIs | Property and BNHub listing detail; reviews; CTA to book or contact. |
| 4 | **Booking flow** | Booking + Payment APIs | Calendar, guest count, price breakdown, checkout, payment, confirmation. Core BNHub flow. |
| 5 | **Host dashboard** | Listing, Booking, Availability, Payout APIs | Listings, calendar, reservations, payouts, messages. Host can operate. |
| 6 | **Broker dashboard** | Leads, Clients, Listing, Messaging APIs | CRM: leads, clients, listings, tasks, notes, messages. |
| 7 | **Owner dashboard** | Listing, Booking, Payment, Analytics APIs | Portfolio, revenue, maintenance, performance. |
| 8 | **Admin dashboard** | Admin + User + Listing + Booking + Payment + Incident + Dispute APIs | Moderation, users, incidents, disputes, audit, feature flags. |
| 9 | **Messaging interface** | Messaging API | Conversation list, thread view, composer. Used by guest, host, broker. |

### Rules

- **Do not build a screen until its API exists.** If the user asks for “booking checkout page,” ensure booking creation and payment capture APIs are implemented first; then build the page that calls them.
- **Use shared layout and components.** Auth screens use a simple layout; dashboard screens use dashboard layout; listing detail uses the shared listing detail template. Per [Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md).
- **Route guards:** Protect routes by auth and role. Redirect unauthenticated users to login; redirect non-admin away from admin routes.

---

## 7. Component library implementation

### Order in which to build UI components

Build primitives first so that feature components can use them. Order:

| Order | Component group | Used by |
|-------|------------------|---------|
| 1 | **Buttons** (primary, secondary, ghost, destructive, loading, icon) | Every screen. |
| 2 | **Inputs** (text, email, password, number) with label, error, helper | Forms and search. |
| 3 | **Cards** (base card, with image, with actions) | Listing cards, metric cards, content blocks. |
| 4 | **Layout containers** (Container, Grid, Stack, PageLayout, DashboardLayout) | All pages. |
| 5 | **Navigation components** (Header, Sidebar, Tabs, Breadcrumb, BottomNav) | App shell and dashboards. |
| 6 | **Tables** (DataTable with sort, pagination, row actions) | Admin, CRM, booking lists. |
| 7 | **Charts** (line, bar, simple KPI) | Dashboards and analytics. |
| 8 | **Calendar components** (date picker, range, availability calendar) | Search and booking. |
| 9 | **Modals and drawers** (modal, drawer, confirmation dialog) | Forms, filters, confirmations. |

### Reuse strategy

- **Primitives live in `ui/`** (or `packages/ui/`). They use design tokens only; no API calls or feature logic.
- **Composed components** (e.g. ListingCard, PriceBreakdown, BookingSummary) live in `shared/components/` or `features/<domain>/components/`. They use primitives and tokens; they may accept callbacks (e.g. onSave) but do not import API client directly; the parent or hook fetches data and passes props.
- When generating a new screen, Cursor should use existing components where possible and create a new component only when the blueprint specifies one that does not exist yet. Prefer composing existing primitives over creating a one-off layout.

---

## 8. Feature-by-feature implementation

### Vertical slice development

For each feature, complete **backend → API → frontend → tests** before moving to the next feature. Example: **BNHub Booking**.

**Backend (same phase or earlier):**

- Booking model and migrations (if not already done).
- Availability check and price calculation.
- Booking creation API (POST /bookings) with validation and idempotency.
- Payment capture integration (booking confirmation triggers payment).
- Calendar block on confirm; release on cancel.

**Frontend:**

- Listing detail: “Book” CTA and date/guest picker (or link to checkout).
- Booking calendar component (availability, min/max nights, selection).
- Booking summary component (dates, guests, price breakdown).
- Checkout flow: guest details, payment method, confirm; success → confirmation page.
- Trips list and trip detail (view booking, message host, cancel).

**Tests:**

- API: create booking (success, validation failure, availability failure); cancel booking.
- Component: booking calendar selects range; price summary shows correct total.
- E2E (optional): search → listing → book → pay → confirmation.

### End-to-end completion

- A feature is “done” when: (1) the user can achieve the goal from the UI (e.g. complete a booking), (2) the data is stored correctly, (3) at least one test covers the happy path. Do not leave a feature with only backend and no UI, or only UI with a stub API that never gets implemented.

---

## 9. Testing strategy

### Testing expectations

| Type | When to write | What to cover |
|------|----------------|---------------|
| **Unit tests** | With or immediately after the function/component | Pure functions (e.g. price calculation, validation); React components (render, user events, accessibility). |
| **API tests** | With or immediately after the endpoint | Request validation (400 on invalid body); auth (401 without token, 403 with wrong role); success (200 and correct body); business rules (e.g. cannot book unavailable dates). |
| **Component tests** | With or after the component | Render with props; user interaction (click, type); error and loading states; accessibility (e.g. axe-core). |
| **Integration tests** | After a feature is complete | Multi-step flow: e.g. register → login → create listing → search → create booking → pay. Use test DB and mock payment provider. |
| **Booking flow tests** | After booking + payment are implemented | Create booking, confirm payment, cancel, refund. Critical path for revenue. |

### When tests should be written

- **Preferred:** In the same Cursor session as the implementation. After generating “POST /bookings,” generate “test: POST /bookings returns 201 and booking when valid.”
- **Minimum:** Before marking a phase or feature complete. No push to main for a new endpoint or flow without at least one automated test covering the happy path.
- Run tests locally and in CI. Fix failing tests before adding new features; do not disable tests to make the build pass.

---

## 10. Debugging and iteration

### How Cursor should fix issues

| Step | Action |
|------|--------|
| **Read logs** | Use application logs (request id, user id, error message). Add logs for errors and key business events (e.g. “booking created”, “payment failed”). When a test or manual check fails, trace the request in logs to find the failing step. |
| **Isolate failing modules** | If a flow fails (e.g. “booking creation fails”), determine which layer: API gateway, booking service, DB, or payment client. Run the failing service in isolation with a minimal request (e.g. curl or test script) to reproduce. |
| **Fix smallest components first** | Fix the root cause in the smallest unit: e.g. fix a validation bug in the booking service rather than adding workarounds in the frontend. Fix a broken component prop instead of duplicating logic elsewhere. |
| **Rerun tests** | After every fix, run the relevant test suite. Ensure the fix does not break other tests (regression). If a test was wrong (e.g. expected wrong status code), update the test and document why. |

### Iteration loop

- Generate a small chunk → run tests → if fail, read error and logs → fix the minimal change → rerun. Do not generate a large blob of code and then try to fix many errors at once; smaller iterations lead to stable code faster.

---

## 11. Continuous integration workflow

### CI/CD expectations

| Item | Expectation |
|------|-------------|
| **Automated tests** | On every push or PR: run unit tests, API tests, and component tests. Fail the build if any test fails. |
| **Build checks** | Backend: build compiles; frontend: build compiles (e.g. `npm run build` or `vite build`). No compilation errors on main. |
| **Lint** | Run ESLint (or equivalent) for frontend and backend. Fix or exclude with justification; do not disable rules broadly. |
| **Deployment pipelines** | Pipeline deploys to dev on merge to main (or on PR to main); optional manual or auto deploy to staging. Production deploy with approval or tagged release. |
| **Staging environment** | Staging mirrors production (same services, DB, env pattern) so that E2E and manual QA run against a realistic setup. Secrets and config for staging are separate from production. |

### What Cursor should generate

- CI config file (e.g. GitHub Actions, GitLab CI): install deps, run tests, build, (optional) deploy to dev. Place in `infrastructure/ci/` or `.github/workflows/`. When adding a new service or app, add the corresponding build and test steps so CI stays green.

---

## 12. Security implementation

### How Cursor must implement security

| Area | Requirement |
|------|-------------|
| **Authentication tokens** | Issue JWT (or opaque token) with user id and roles; short-lived access token (e.g. 15–60 min). Validate on every protected request; reject expired or invalid with 401. Do not log or expose token in responses. Store refresh token securely if used; rotate on use if required by policy. |
| **Password hashing** | Use bcrypt or Argon2 for passwords. Never store plain text; never log password or hash. Minimum complexity enforced on registration (length, complexity per [API Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md)). |
| **Secure payment flows** | Use provider SDK (e.g. Stripe); never handle raw card numbers. Use idempotency keys for payment and refund. Validate amount and currency server-side; do not trust client for charge amount. |
| **File upload validation** | Validate file type (whitelist MIME and extension), size (max per blueprint), and optionally content (e.g. image header). Store in object storage with generated path; do not execute uploaded files. |
| **Rate limiting** | Apply rate limits at gateway or app: per IP for auth (e.g. login 5 per 15 min); per user for API. Return 429 with Retry-After when exceeded. |
| **Authorization** | Every protected endpoint must check not only “is user logged in” but “does user have role/permission and (where applicable) resource ownership.” Return 403 when unauthorized. |
| **Secrets** | No API keys or DB URLs in code. Use environment variables or a secrets manager. Document required env vars in README or `.env.example` (with placeholder values only). |

When generating auth, payment, or file-upload code, Cursor must follow these rules; if the user’s request contradicts them (e.g. “store password in plain text”), Cursor should refuse or suggest the secure alternative.

---

## 13. Performance optimization

### Optimization steps (when to apply)

| Area | When and how |
|------|--------------|
| **API caching** | Add caching for read-heavy, stable data (e.g. listing detail by id, static config). Use short TTL (e.g. 1 min) and invalidate on update. Do not cache user-specific or payment data in a shared cache without care. |
| **Database indexing** | Per [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md): indexes on (user_id, status), (listing_id, date), (booking_id), etc. Add indexes when a migration introduces a table that is queried by non-primary key. |
| **Lazy loading** | Frontend: lazy-load routes and heavy components (e.g. chart, map). Load listing images with lazy loading and appropriate sizes. |
| **Image optimization** | Serve images from CDN; use responsive srcset; compress (WebP/AVIF where supported). Store multiple sizes for listing photos if needed. |
| **Query optimization** | Avoid N+1: use joins or batch load for list endpoints (e.g. bookings with listing and user). Select only needed columns for list views. Use pagination; do not load unbounded lists. |

Apply these when a feature is in place and metrics or tests show a bottleneck. Do not over-engineer before launch; prefer “correct and simple” first, then optimize with data.

---

## 14. Documentation maintenance

### Documentation practices

| Doc type | When to update | Where |
|----------|----------------|--------|
| **API documentation** | When adding or changing an endpoint | OpenAPI/Swagger spec or API README. Document path, method, body, response, errors, and auth. Keep in sync with code. |
| **Component documentation** | When adding or changing a UI component | Storybook story or component README. Document props, variants, and usage. |
| **Database schema updates** | When adding or changing a migration | Migration file is the source of truth; ensure [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) or CHANGELOG is updated if the canonical schema doc is maintained in repo. |
| **Feature notes** | When completing a feature | Short note in CHANGELOG or release notes: “Added booking creation API and checkout flow.” Helps product and support. |

Cursor should not duplicate the full architecture docs inside the repo. It should update or add only the minimal docs that keep the codebase understandable (e.g. README per service, API spec, component props).

---

## 15. Launch preparation

### Final preparation before launch

| Area | What Cursor can generate or document |
|------|--------------------------------------|
| **Beta testing** | Checklist or script for beta: sign up, create listing, search, book, pay, message, review, host dashboard, payout. E2E test coverage for these paths. |
| **Host onboarding** | Docs or in-app copy: how to verify, add payout method, create first listing, set availability. Optional: onboarding checklist in host dashboard. |
| **Broker onboarding** | Similar: how to access CRM, add lead, link listing. |
| **Support readiness** | Support console access; runbook for common issues (e.g. “guest cannot pay” → check payment method, provider status). Escalation path to Trust & Safety and admin. |
| **Incident monitoring** | Alerts and dashboards: error rate, latency, booking success rate, payment failure rate. Runbook for “booking API down” or “payment provider timeout.” |

These are mostly operational and documentation tasks. Cursor can generate runbooks, checklists, and E2E test lists; actual onboarding and support processes are owned by operations. Use [Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) for the full launch checklist.

---

## 16. Post-launch iteration

### How development continues after launch

| Area | Focus |
|------|--------|
| **Feature improvements** | Prioritize by usage and feedback: e.g. better search filters, faster checkout, clearer host dashboard. Follow [Build Order](LECIPM-BUILD-ORDER.md) Phase 19 and beyond; use [PRD](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md) and roadmap for backlog. |
| **AI model training** | Use production data (anonymized or aggregated per policy) to improve fraud, risk, pricing, and demand models. Retrain and deploy with validation; log model version and outcomes for audit. |
| **Analytics improvements** | Add metrics and dashboards for product and operations; optimize warehouse and ETL if needed. |
| **Market expansion features** | Localization, multi-currency, regional compliance, and new payment methods per [Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md). Implement as config and feature flags where possible. |

Cursor should continue to respect the build order and modular structure when adding post-launch features. Each new feature should be a vertical slice (backend + API + frontend + tests) and should integrate with existing services and docs rather than duplicating logic.

---

This guide is the **Cursor Execution Mode** reference for building the LECIPM platform: use it to generate code step-by-step, respect dependencies, keep modules small, test continuously, and convert the architecture into working software without generating the whole platform at once.

---

*References: [LECIPM Build Order](LECIPM-BUILD-ORDER.md), [LECIPM System Map](LECIPM-SYSTEM-MAP.md), [LECIPM Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md), [LECIPM Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [LECIPM API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [LECIPM Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [LECIPM Design System Blueprint](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [LECIPM Design-to-Code Implementation Guide](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md), [LECIPM Montreal Launch Playbook](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md), [LECIPM Global Expansion Blueprint](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md), [LECIPM Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md).*
