# Platform simulation (realistic seed data)

This document describes how to load **realistic simulation data** across all sections of the platform so you can explore and test flows as in production.

## Prerequisites

- PostgreSQL running and `DATABASE_URL` set in `apps/web/.env`
- Migrations applied: `npx prisma migrate deploy` (or `prisma migrate dev`)

## Run the simulation seed

From the `apps/web` directory:

```bash
npm run seed
# or
npx prisma db seed
```

This populates the database with:

| Section | What is created |
|--------|------------------|
| **Users** | Guest, 2 hosts, broker, ambassador, investor (emails below) |
| **Property identities** | 2 properties (Montreal, Mont-Tremblant) |
| **BNHub – Listings** | 4 short-term listings (published/draft, different cities) |
| **BNHub – Bookings** | 4 bookings: confirmed, completed, pending, disputed |
| **BNHub – Payments** | Payments for confirmed/completed bookings |
| **BNHub – Review** | One 5-star review for a completed stay |
| **BNHub – Dispute** | One dispute under review |
| **Host quality** | Super-host style score for one host |
| **Referrals** | Referral program, code `DEMO-REF-001`, ambassador, commission |
| **Projects** | 2 new-development projects with units |
| **Project subscription** | Trial subscription for one project |
| **Favorites / Alerts / Reservations** | User favorites a project, has an alert, one reservation |
| **Leads** | 2 leads (project context, one unlocked) |
| **Real estate transaction** | 1 transaction with offer, timeline, and steps |
| **Trust & Safety** | 2 incidents (one under review with host response, one resolved) |
| **Billing** | Host Pro plan, active subscription, paid invoice, billing event |
| **Property (sale)** | One long-term/sale property |

## Demo accounts (after seed)

| Email | Role | Use for |
|-------|------|--------|
| `guest@demo.com` | User | BNHub guest: bookings, reviews, project favorites, alerts, reservation |
| `host@demo.com` | Owner/Host | BNHub host, listings, subscription, transaction seller |
| `host2@demo.com` | Owner/Host | Second host, more listings |
| `broker@demo.com` | Licensed Professional | Real estate transaction broker |
| `ambassador@demo.com` | User | Referral code, ambassador dashboard, commissions |
| `investor@demo.com` | Investor | Bookings, dispute, real estate transaction buyer |

## Idempotency

The seed uses **upserts** (where possible) with fixed IDs, so you can run it multiple times. New records (e.g. leads, incidents, commissions) are created each run; main entities (users, listings, projects, etc.) are updated if they already exist.

## Resetting and re-seeding

To start fresh:

```bash
npx prisma migrate reset
```

This drops the database, reapplies migrations, and runs the seed automatically.
