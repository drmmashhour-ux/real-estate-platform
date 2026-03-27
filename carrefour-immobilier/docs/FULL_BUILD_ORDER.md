# CARREFOUR IMMOBILIER — FULL BUILD ORDER

**Production auth (password + JWT + register/login):** see **`docs/FULL_PRODUCTION_BUILD.md`**.

This repo follows the checklist below with these **implementation notes**:

| Topic | Note |
|--------|------|
| **Prisma** | Uses **Prisma 5.22** so `schema.prisma` can include `url = env("DATABASE_URL")` and `lib/prisma.ts` can use **`new PrismaClient()`** (Prisma 7 forbids `url` in the schema and requires a driver adapter). |
| **`prisma.config.ts`** | Removed (Prisma 5 uses the schema file only). |
| **`/api/chat`** | OpenAI client is created **inside `POST`** so `next build` works when `OPENAI_API_KEY` is unset; model **`gpt-4.1-mini`** as in the spec. |
| **Test flow** | Run `npx prisma db seed` first (creates seller/buyer with fixed UUIDs). **`POST /api/contract`** and **`POST /api/deal/close`** are included so signatures and `closeDeal` can be exercised via HTTP (not in the minimal route list, but required for FKs + automation). |
| **`lib/stripe.ts`** | Matches the spec; nothing imports it until you add payment routes — set **`STRIPE_SECRET_KEY`** before using it. |
| **Auth** | **`User.password`** (bcrypt), **`JWT_SECRET`**, **`/api/auth/register`**, **`/api/auth/login`**, **`/login`** — register response omits password. |

## Commands

```bash
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, Supabase, Stripe, OpenAI
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
npm run demo:flow      # registers users + login + full API chain (needs JWT_SECRET)
```

## Seed IDs (for manual API tests)

- Seller: `11111111-1111-1111-1111-111111111111`
- Buyer: `22222222-2222-2222-2222-222222222222`
- Password after seed: **`CarrefourDemo2025!`** (both accounts)

Use **`ownerId` = seller** on `POST /api/property`, and matching IDs for messages/offers — or use **`npm run demo:flow`** which registers fresh users.
