# AI real estate investment MVP (web-app)

## Flow

**Landing** (`/`) → **Analyze** (`/analyze`) → **Save deal** (POST `/api/investment-deals`) → **Portfolio** (`/dashboard`)

## Routes

| Path | Auth |
|------|------|
| `/` | Public |
| `/analyze` | Public |
| `/dashboard` | Required (proxy + layout) |
| `GET/POST /api/investment-deals` | Required (proxy + handler) |

## Database

- Model: `InvestmentDeal` (`investment_deals` table)
- Apply schema: `npx prisma migrate deploy` (or `prisma db push` when DB matches schema)

## Prisma migration

`prisma/migrations/20260320210000_investment_deals_mvp/migration.sql` creates `investment_deals` if missing.
