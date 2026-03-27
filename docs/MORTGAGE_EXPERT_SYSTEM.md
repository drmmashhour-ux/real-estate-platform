# Mortgage expert system

## Roles

- Prisma `PlatformRole`: **`MORTGAGE_EXPERT`**

## Flow

1. **`/auth/signup-expert`** → `POST /api/auth/register` with `role: "MORTGAGE_EXPERT"` → creates `User` + **`MortgageExpert`** (profile).
2. **`/auth/login`** → password login → redirects mortgage experts to **`/dashboard/expert`** (or `?next=`).
3. **`/dashboard/expert`** → edit profile, upload photo (`POST /api/mortgage/expert/photo` → `public/uploads/mortgage-experts/`).
4. **`/dashboard/expert/leads`** → assigned leads (`leadType = mortgage`, `assignedExpertId`).
5. **`/mortgage`** → public page: expert cards + **`POST /api/mortgage/lead`** (assigns first **active** expert).
6. **Admin** → **`/admin/mortgage-experts`** → activate / deactivate experts (`PATCH /api/admin/mortgage-experts`).

## Lead fields

- `leadSource`: `mortgage_inquiry`
- `leadType`: `mortgage`
- `assignedExpertId`: FK to `MortgageExpert`
- `mortgageInquiry`: JSON (price, down payment, timeline, etc.)

## Migrations

```bash
cd apps/web && npx prisma migrate deploy && npx prisma generate
```

## Production uploads

File writes go to **`public/uploads/mortgage-experts/`** (fine on a persistent Node host). On **serverless** filesystems, swap the upload handler for S3/etc. later — DB stores the public path (e.g. `/uploads/mortgage-experts/{id}.jpg`).

## BNHub login

Demo / host quick login remains at **`/bnhub/login`**. General password login: **`/auth/login`**.
