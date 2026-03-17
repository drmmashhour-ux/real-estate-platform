# User Service

User profiles, roles, verification status, account settings, and session management for LECIPM. Uses the same database as auth-service; adds `user_settings` table.

**Reference:** [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §3.

---

## Features

- **User profiles** — Full profile (GET /users/me) and public profile (GET /users/:id).
- **Roles and permissions** — Reads roles from shared `user_roles` table; admin can see email on GET /users/:id.
- **Verification status** — Exposed in profile (`verificationStatus`: PENDING | VERIFIED | FAILED).
- **Account settings** — GET/PATCH /users/me/settings (JSON key-value; merge on PATCH).
- **Session management** — GET /users/me/sessions lists active sessions (from shared `user_sessions`).

---

## Setup

1. **Database:** Use the same `DATABASE_URL` as auth-service. Run auth-service migrations first, then:
   ```bash
   cd services/user-service && npm run db:generate && npm run db:push
   ```
   This adds the `user_settings` table only.

2. **Environment:** Copy `.env.example` to `.env`. Set `DATABASE_URL` and `JWT_ACCESS_SECRET` (same as auth-service).

3. **Run:** `npm run dev` (port 3002).

---

## REST API (base path `/v1/users`)

All endpoints require `Authorization: Bearer <access_token>` (from auth-service login).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Current user profile (id, email, name, phone, locale, timezone, verificationStatus, roles, etc.). |
| PATCH | `/me` | Update profile (name?, phone?, locale?, timezone?). |
| GET | `/:id` | Public profile by id (email only if self or admin). |
| GET | `/me/settings` | Current user settings (JSON object). |
| PATCH | `/me/settings` | Update settings (body: `{ "settings": { ... } }`; merged with existing). |
| GET | `/me/sessions` | List active sessions (id, createdAt, expiresAt). |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with tsx watch (port 3002) |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled dist |
| `npm test` | Run unit tests |
| `npm run db:generate` | Prisma generate |
| `npm run db:push` | Push schema (adds user_settings) |
