# Neon production password rotation (`DATABASE_URL`)

Use this after any credential exposure or on a regular security cadence.

## 1. Neon

1. Open the Neon project that backs production.
2. Rotate the database user password (or create a new role + grant, then switch).
3. Copy the **pooled** connection string (`*.neon.tech`, usually contains `-pooler`).
4. Ensure the URL ends with `sslmode=require` (or equivalent TLS parameters).

## 2. Vercel (project that serves production traffic)

1. **Settings → Environment Variables**
2. Update **`DATABASE_URL`** with the new string.
3. Apply to **Production** (and Preview/Development if those environments should hit the same DB).
4. Remove obsolete Postgres duplicates if they reappear: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`.

## 3. Deploy

1. **Deployments → Redeploy** the latest production deployment.
2. Enable **Clear build cache** if the deployment was created before the env change.

## 4. Verify

1. Open **`GET /api/ready`** on the production hostname.
2. Expect **`ready`: true**, **`db`**: `"connected"`, **`dbTargetHost`** containing **`neon.tech`**.
3. Spot-check auth-critical flows (login) and one BNHub read.

## 5. Post-rotation

1. Invalidate any CI secrets or backup scripts that embedded the old URL.
2. Confirm no copies of the old password remain in tickets, chat, or runbooks.

## Related

- [API_READY_AND_DATABASE_URL.md](./API_READY_AND_DATABASE_URL.md) — interpreting readiness and host hints.
