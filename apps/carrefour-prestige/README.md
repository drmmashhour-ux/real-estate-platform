# LECIPM (Le Carrefour Immobilier Prestige)

Production-grade foundation: **Next.js (App Router)**, **TypeScript**, **Tailwind v4**, **Prisma**, **PostgreSQL**, **Supabase Auth**, **Stripe**, **OpenAI**.

> **Not legal/tax/financial advice.** Contract PDFs and calculators are **estimates** and **templates** — require licensed professional review before real use.

## Install commands

```bash
cd apps/carrefour-prestige
npm install
cp .env.example .env
# Set DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (required for auth middleware)
# Optional: OPENAI_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY (storage)
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

If `npm run build` runs without Postgres, ensure `DATABASE_URL` points to a reachable DB or use CI with a disposable Postgres for migrations only.

App runs on **http://localhost:3040** by default.

## Auth flow

1. **Register** at `/register` — Supabase `signUp` with `user_metadata.role`.
2. First visit to a protected route creates/links **Prisma** `User` + `Profile` (`src/lib/auth/current-user.ts`).
3. **Middleware** (`src/middleware.ts`) redirects unauthenticated users away from `/dashboard` and `/chat`.

## Structure

- `src/app` — routes (marketing, auth, dashboard, API).
- `src/components` — UI (marketing, dashboard, property).
- `src/lib` — Prisma, Supabase, Stripe, OpenAI, finance/investor helpers, contract PDF.
- `src/actions` — server actions (validated property create).
- `src/validators` — Zod schemas.
- `prisma/schema.prisma` — full data model.

## Deploy (Vercel)

See `docs/VERCEL.md` in the sibling **carrefour-immobilier** project or set the same env vars in Vercel: `DATABASE_URL`, Supabase keys, `JWT_SECRET` (if you add JWT later), `OPENAI_API_KEY`, Stripe keys, `NEXT_PUBLIC_APP_URL`.

## Next steps (your team)

- Wire **Supabase Storage** uploads for `PropertyImage` and contract PDFs (`SUPABASE_SERVICE_ROLE_KEY` server-only).
- Add **MessageThread** creation APIs and UI.
- Extend **offers** with seller accept/reject server actions + notifications.
- Add **Stripe webhook** to sync `Subscription` rows.
