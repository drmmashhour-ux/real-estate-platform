# Vercel + Supabase — `DATABASE_URL` for Prisma (fix 503)

Use this when **`app.lecipm.com`** (or any Vercel deployment) returns **503** on `/`, `/listings`, and `/api/ready` because the **root layout** cannot run Prisma queries.

**No application code changes** — only Vercel + Supabase configuration.

---

## 1. Where to set it

**Vercel** → your Next.js project (`apps/web` root) → **Settings** → **Environment Variables** → scope **Production**.

- Variable name: **`DATABASE_URL`** (exactly — Prisma reads `env("DATABASE_URL")` in `prisma/schema.prisma`).
- After saving: **Deployments** → open latest → **⋯** → **Redeploy** (env is baked at build/runtime per Vercel; redeploy ensures workers pick it up).

---

## 2. Use Supabase **pooler** (not direct DB on serverless)

| Use on Vercel | Avoid for serverless runtime |
|---------------|------------------------------|
| **Connection pooling** URI, usually port **6543** | Direct `db.<project>.supabase.co` **:5432** as the only URL (easy to hit connection limits) |
| Host often contains **`pooler.supabase.com`** (or Supavisor hostname Supabase shows) | `localhost`, LAN IPs |

In **Supabase Dashboard** → **Project Settings** → **Database**:

1. Open **Connection string** / **Connection pooling** (wording varies).
2. Choose **Transaction** mode (appropriate for **Prisma** on serverless).
3. Copy the **URI** (postgres:// or postgresql://).

---

## 3. URI shape (example — replace with yours)

```text
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Requirements:**

- **`sslmode=require`** (or provider-equivalent) unless Supabase explicitly documents otherwise.
- **Password**: URL-encode special characters (`@`, `#`, `/`, etc.).
- **Port**: pooler is typically **6543**; direct is often **5432** — do not mix them up.

### Prisma + PgBouncer

If logs show **prepared statement** / **PgBouncer** errors, append:

```text
&pgbouncer=true
```

Example:

```text
postgresql://...pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

---

## 4. Migrations vs runtime (no schema change)

`schema.prisma` uses a **single** `DATABASE_URL`. For **`prisma migrate deploy`**:

- Run from **CI or your machine** with a URL that allows DDL, often the **direct** (non-pooler) connection, e.g.  
  `DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres?sslmode=require" pnpm exec prisma migrate deploy`  
- Keep **Vercel Production** `DATABASE_URL` on the **pooler** for app traffic.

Do **not** point production app traffic at a DB that is down or firewalled.

---

## 5. Verify after redeploy

```bash
curl -sS -o /dev/null -w "home %{http_code}\n" https://app.lecipm.com/
curl -sS -o /dev/null -w "listings %{http_code}\n" https://app.lecipm.com/listings
curl -sS -o /dev/null -w "ready %{http_code}\n" https://app.lecipm.com/api/ready
```

Expect **200**. JSON from `/api/ready` should include `"ready": true` and `"db": "connected"`.

---

## 6. If still failing

1. **Vercel** → **Deployments** → failed/latest → **Build Logs** / **Functions** logs — search for `Prisma`, `P1001`, `ECONNREFUSED`, `timeout`, `SSL`.
2. Confirm the variable is set for **Production**, not only Preview.
3. **Supabase** → ensure project is **active**; check **Database** health; review **network restrictions** (allow Vercel egress or use pooler as documented by Supabase).

---

## Related

- `docs/deployment/APP_LECIPM_503.md` — why missing DB breaks every page  
- `docs/deployment/GIT_VERCEL_APP_DOMAIN.md` — full env list for `app.lecipm.com`  
- `apps/web/.env.production.example` — template (no secrets)
