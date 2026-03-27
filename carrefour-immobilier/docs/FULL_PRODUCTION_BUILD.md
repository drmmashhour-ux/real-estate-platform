# CARREFOUR IMMOBILIER — FULL PRODUCTION BUILD

See also **`docs/FULL_PRODUCTION_SYSTEM.md`** (latest checklist) and **`docs/VERCEL.md`**.

Implemented in this repo:

- **Prisma 5** with `url = env("DATABASE_URL")` in `schema.prisma`
- **User.password** (bcrypt) + **JWT** (`JWT_SECRET`, `lib/auth.ts`)
- **`POST /api/auth/register`** — returns user **without** password hash
- **`POST /api/auth/login`** — returns `{ token }` (payload: `id`, `email`, `role` — never the password)
- **`/app/login`** — stores token in `localStorage` (add Authorization headers on protected routes when you wire middleware)
- **`/api/chat`** — OpenAI client created **per request** so `next build` works without `OPENAI_API_KEY` in CI (returns 503 if missing)

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET (long random), OPENAI_API_KEY, Stripe, Supabase, …

npx prisma migrate dev --name init_production_auth
npx prisma db seed   # optional: seller@ / buyer@ carrefour.local + demo password
npm run dev
```

## Mandatory test flow

Use **`npm run demo:flow`** (registers two users, logs in, then runs property → … → close deal) or:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/property` … (see `scripts/run-demo-flow.mjs`)

## Seed demo users

After migrate + seed, login at `/login`:

- `seller@carrefour.local` / `buyer@carrefour.local`
- Password printed once by seed (default: **`CarrefourDemo2025!`**)
