# Auth Service

Authentication service for the LECIPM platform: user registration, login, JWT access/refresh tokens, password hashing, and role-based access (guest, host, broker, owner, admin).

**Reference:** [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md) §3, [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §2. **Build order:** Phase 2 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).

---

## Features

- **User registration** — Email + password, optional name, phone, locale, role (default: guest).
- **Login** — Returns access + refresh JWT and session record.
- **Logout** — Invalidates refresh token (session).
- **Refresh** — Issue new access (and optional refresh) token from refresh token.
- **GET /me** — Current user (protected).
- **Password hashing** — bcrypt (12 rounds).
- **Roles** — `GUEST`, `HOST`, `BROKER`, `OWNER`, `ADMIN`.
- **Database** — Prisma + PostgreSQL: `users`, `user_roles`, `user_sessions`.
- **Input validation** — Zod schemas for all request bodies (register, login, logout, refresh); returns 400 with clear messages.
- **Environment validation** — On startup, checks `DATABASE_URL`; in production also requires `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars).

---

## Architecture (clean / modular)

```
src/
├── domain/           # Entities, enums, ports (interfaces)
│   ├── entities/
│   ├── enums/
│   └── ports/
├── use-cases/        # RegisterUser, Login, Logout, RefreshTokens, GetMe
├── adapters/
│   ├── http/         # Express routes, auth middleware, error handler
│   └── persistence/  # Prisma repositories
├── infrastructure/   # BcryptPasswordHasher, JwtTokenService
├── config.ts
├── app.ts
└── index.ts
```

---

## Setup

1. **Install dependencies**

   ```bash
   cd services/auth-service && npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string.
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — Min 32 chars in production.
   - `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` — e.g. `15m`, `7d`.
   - `PORT` — Default `3001`.

3. **Database**

   ```bash
   npm run db:generate
   npm run db:push
   # or: npm run db:migrate
   ```

4. **Run**

   ```bash
   npm run dev
   ```

---

## REST API (base path `/v1/auth`)

| Method | Endpoint       | Auth    | Description                    |
|--------|----------------|---------|--------------------------------|
| POST   | `/register`    | No      | Create account; body: email, password, name?, phone?, locale?, role? |
| POST   | `/login`       | No      | Body: email, password. Returns user + accessToken + refreshToken + expiresIn. |
| POST   | `/logout`      | No      | Body: refreshToken. 204.       |
| POST   | `/refresh`     | No      | Body: refreshToken. New tokens. |
| GET    | `/me`          | Bearer  | Current user.                  |

**Protected routes:** `Authorization: Bearer <accessToken>`.

**Errors:** JSON `{ "error": { "code": "...", "message": "..." } }`. Codes: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_EXPIRED`, `USER_NOT_FOUND`, `UNAUTHORIZED`, `INVALID_TOKEN`, `FORBIDDEN`, `INTERNAL_ERROR`.

---

## Tests

- **Unit (no DB):** `npm test` — use cases, password hasher, role validation.
- **Integration (DB required):** Set `DATABASE_URL` and run `npm test`; integration suite runs register → login → me → refresh → logout.

---

## Scripts

| Script         | Description                |
|----------------|----------------------------|
| `npm run dev`  | Run with tsx watch         |
| `npm run build`| Compile TypeScript         |
| `npm run start`| Run compiled dist          |
| `npm test`     | Vitest (unit + integration if DB set) |
| `npm run db:generate` | Prisma generate client |
| `npm run db:push`     | Push schema (no migrations) |
| `npm run db:migrate`  | Migrate dev                |
| `npm run db:studio`  | Prisma Studio              |
