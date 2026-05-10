# SYBNB / Syria — Localhost Review Guide

## Quick Start

```bash
cd apps/syria

# Create .env (DATABASE_URL must NOT contain "lecipm")
cat > .env << 'EOF'
DATABASE_URL="postgresql://syria_user:syria_pass@localhost:5432/syria_dev"
DIRECT_URL="postgresql://syria_user:syria_pass@localhost:5432/syria_dev"
NODE_ENV=development
APP_ID=syria
EOF

# Create database (Docker Postgres must be running)
docker exec docker-postgres-1 psql -U lecipm -c "CREATE DATABASE syria_dev;"
docker exec docker-postgres-1 psql -U lecipm -d syria_dev -c "CREATE USER syria_user WITH PASSWORD 'syria_pass';"
docker exec docker-postgres-1 psql -U lecipm -d syria_dev -c "GRANT ALL PRIVILEGES ON DATABASE syria_dev TO syria_user; GRANT ALL ON SCHEMA public TO syria_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO syria_user;"

# Push schema
pnpm exec prisma db push --schema=./prisma/schema.prisma

# Start dev server
pnpm exec next dev -H 0.0.0.0 -p 3002 --webpack
```

Open: http://localhost:3002/ar

## Required Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | PostgreSQL URL (no "lecipm") | **REQUIRED** — env guard blocks "lecipm" |
| `DIRECT_URL` | Same or non-pooled URL | **REQUIRED** for migrations |
| `APP_ID` | `syria` | Validated by env guard |
| `NODE_ENV` | `development` | Standard |

## Review-Safe Configuration

Payments are **STUB ONLY** by default. No additional flags needed to disable them.

| System | Status | Notes |
|--------|--------|-------|
| Stripe payments | STUB | Returns fake payment intent IDs |
| Real checkout | BLOCKED | No Stripe keys configured |
| Payouts | DISABLED | No payout logic active |
| Email | DISABLED | No Resend key |
| File uploads | DEGRADED | No Supabase storage |

## Critical Routes for Review

### Public (no auth needed)

| Route | Expected |
|-------|----------|
| `/ar` | Arabic homepage with RTL layout |
| `/en` | English homepage with LTR layout |
| `/ar/sybnb` | SYBNB stays marketplace |
| `/ar/login` | Login page |
| `/ar/demo` | Investor demo (disabled state if demo mode off) |

### Protected (redirect to login)

| Route | Expected |
|-------|----------|
| `/ar/dashboard` | → redirect to login |
| `/ar/admin` | → redirect to login |

### APIs

| Route | Expected |
|-------|----------|
| `/api/health` | 200 OK |
| `/api/sybnb/payment-intent` | 405 (POST only) |

## Known Limitations

- No register page (`/ar/register` = 404) — registration via login flow
- Payments return stub IDs — no real Stripe
- No file uploads — no Supabase storage configured
- Admin/dashboard require authentication

## Rollback

If localhost becomes unstable:
1. Stop dev server (Ctrl+C)
2. Delete `.next/` directory: `rm -rf .next`
3. Regenerate Prisma: `pnpm exec prisma generate --schema=./prisma/schema.prisma`
4. Restart: `pnpm exec next dev -H 0.0.0.0 -p 3002 --webpack`
