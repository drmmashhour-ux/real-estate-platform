# LECIPM — Development Setup

This document describes how to run the LECIPM platform locally for the first operational flow: **register → login → create listing → search → book → pay → communicate → review → trust & safety**.

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** (workspaces)
- **PostgreSQL** (local or Docker)
- **Git**

---

## 1. Clone and install

```bash
git clone <repo-url>
cd real-estate-platform
npm install
```

---

## 2. Environment

Copy the root env template and set at least the database URL:

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://user:password@localhost:5432/lecipm
```

Optional per-service env (see each service README):

- `services/auth-service/.env` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `apps/web/.env` — `DATABASE_URL` (for BNHub Prisma), `NEXT_PUBLIC_APP_URL`
- Other services: `PORT`, `DATABASE_URL` as needed

---

## 3. Database

**Option A — Docker Postgres**

```bash
npm run docker:up
# Then set DATABASE_URL=postgresql://lecipm:lecipm@localhost:5432/lecipm (see infrastructure/docker/docker-compose.yml)
```

**Option B — Local Postgres**

Create a database and set `DATABASE_URL` in `.env`.

**Apply schema and seed (web-app + BNHub)**

```bash
cd apps/web
npx prisma db push
npx prisma db seed
cd ../..
```

For **auth-service** (if using same DB): run migrations or `db push` from `services/auth-service` so tables `users`, `user_roles`, `user_sessions`, `password_reset_tokens` exist.

---

## 4. Run the platform

**Web app only (BNHub flow)**

```bash
npm run dev
# Open http://localhost:3000
```

**With auth service**

```bash
# Terminal 1
npm run dev:auth
# Terminal 2
npm run dev
```

**All services** (each in its own terminal or use a process manager):

| Service        | Command              | Port (default) |
|----------------|----------------------|----------------|
| auth-service   | `npm run dev --workspace=@lecipm/auth-service` | 3001 |
| user-service   | `npm run dev --workspace=@lecipm/user-service` | 3002 |
| listing-service | `npm run dev --workspace=@lecipm/listing-service` | 3003 |
| search-service | `npm run dev --workspace=@lecipm/search-service` | 3004 |
| booking-service | `npm run dev --workspace=@lecipm/booking-service` | 3005 |
| payment-service | `npm run dev --workspace=@lecipm/payment-service` | 3006 |
| messaging-service | `npm run dev --workspace=@lecipm/messaging-service` | 3007 |
| review-service | `npm run dev --workspace=@lecipm/review-service` | 3008 |
| trust-safety   | `npm run dev --workspace=@lecipm/trust-safety` | 3009 |
| web-app        | `npm run dev --workspace=apps/web` | 3000 |

---

## 5. First flow (BNHub)

1. Open http://localhost:3000/bnhub
2. Search listings (e.g. Montreal)
3. Open a listing → pick dates → Book
4. Sign in (or use guest session) → complete booking
5. Pay (mock) → confirmation
6. Optional: messages, leave a review

---

## 6. Tests

```bash
# Auth service
cd services/auth-service && npm test

# Root (if configured)
npm run test
```

---

## 7. Build

```bash
npm run build
```

Builds all workspaces that define a `build` script. Fix any TypeScript or lint errors per service.

---

## Troubleshooting

- **Database connection refused** — Ensure Postgres is running and `DATABASE_URL` is correct.
- **Prisma client out of date** — Run `npx prisma generate` in the service or app that uses Prisma.
- **Port in use** — Change `PORT` in the service `.env` or stop the process using the port.
- **CORS** — APIs are intended to be called from same origin or a configured BFF; configure CORS in each service if calling from another origin.
