# Platform run checklist (step-by-step)

Use this to verify the platform builds, runs, and key routes respond.

## 1. Build

```bash
cd apps/web && npm run build
```

**Expected:** Exit 0, "Compiled successfully", list of routes.

---

## 2. Tests

```bash
cd apps/web && npm test -- --run
```

**Expected:** All 30 test files, 136 tests passed.

---

## 3. Start dev server

```bash
cd apps/web && npm run dev
```

**Expected:** "Ready" on http://localhost:3001 (use `pnpm dev:3000` only if you need legacy port 3000).

---

## 4. Key pages (browser or curl)

| Path        | Expected |
|------------|----------|
| `/`        | 200      |
| `/projects`| 200      |
| `/dashboard` | 307 (redirect to login when not authenticated) |
| `/bnhub`   | 200      |
| `/listings` | 200    |
| `/signup`  | 200      |
| `/contact` | 200      |

---

## 5. Key API routes

| Path | Expected | Notes |
|------|----------|------|
| `GET /api/projects` | 200 | Uses demo data if DB empty |
| `GET /api/dev/simulation` | 200 | Simulation info + demo accounts |
| `GET /api/auth/demo-users` | 200 or 500 | 200 when `DATABASE_URL` is set; 500 when DB is not configured |

---

## 6. Database and simulation (optional)

- Set `DATABASE_URL` in `.env` (PostgreSQL).
- Run migrations: `npx prisma migrate deploy`
- Run simulation seed: `npm run seed`
- Then `/api/auth/demo-users` returns demo users and app can use full data.

---

## Quick one-liner checks

```bash
# Build
npm run build

# Tests
npm test -- --run

# After dev server is running:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/          # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/projects  # expect 200
```
