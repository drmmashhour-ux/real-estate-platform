# Security posture summary (LECIPM / apps/web)

Maps common hardening goals to **what is implemented in code** vs **what you configure or run manually**.

| Area | In codebase | You configure / operate |
|------|-------------|-------------------------|
| **1. DB TLS** | Warns if non-local `DATABASE_URL` lacks `sslmode=require` (etc.); optional **`REQUIRE_DATABASE_SSL_IN_URL=1`** fails boot (`lib/db/database-url-ssl.ts`, `lib/env/production.ts`). | Set production **`DATABASE_URL`** in Vercel with **`?sslmode=require`** (Neon/RDS). Use pooled host on serverless. |
| **2. Auth** | **httpOnly** session cookie + DB session table; **regeneration** on login (new token, prior sessions revoked — `createDbSession`). Role checks server-side. Email **2FA** when enabled. JWT not used for first-party web. | Enable **`NEXT_PUBLIC_*` / Stripe / secrets** per `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md`. For external clients, add JWT/OAuth separately. |
| **3. Rate limits & IP abuse** | **Redis-backed** limits when **`REDIS_URL`** set; **`gateDistributedRateLimit`** on contact/waitlist/Immo/buyer contact/password reset; **login/register** distributed + optional **`RATE_LIMIT_IP_BLOCK`**. | Set **`REDIS_URL`**, optionally **`RATE_LIMIT_IP_BLOCK=1`**. |
| **4. Upload malware** | **`scanBufferBeforeStorage`** (ClamAV and/or webhook); MIME/size on listing & doc paths — see **`MALWARE-SCANNING.md`**. | **`CLAMAV_HOST`** and/or **`MALWARE_SCAN_WEBHOOK_URL`**; optional **`MALWARE_SCAN_REQUIRED=1`**. |
| **5. API authorization** | Middleware + **`requireApiSession`**, **`requireAdminSession`**, **`CRON_SECRET`** for `/api/admin`. TrustGraph API keys where applicable. | Review new routes for consistent guards. |
| **6. Monitoring & audit** | **Sentry** (`sentry.*.config.ts`, `instrumentation-client.ts`); structured **`lecipm_security`** logs; login failure **`platformEvent`** rows. | **`SENTRY_DSN`**, **`NEXT_PUBLIC_SENTRY_DSN`**. Log drain + alerts (see **`INCIDENT-RESPONSE.md`**). |
| **7. Security headers** | **HSTS** (prod), **X-Frame-Options**, **X-XSS-Protection: 0**, **nosniff**, **Referrer-Policy**, **Permissions-Policy**, CSP **frame-ancestors** (`buildHttpSecurityHeaders`). | Full script CSP nonces: future hardening. |

## Manual next steps (recommended)

These are **not** fully automated without secrets/targets:

1. **Dependency audit:** `pnpm audit` plus **Snyk** — see **`.github/workflows/snyk.yml`** and [`ZAP_AND_SNYK.md`](./ZAP_AND_SNYK.md).
2. **Dynamic scan:** **OWASP ZAP** — see **`.github/workflows/zap-baseline.yml`** and [`ZAP_AND_SNYK.md`](./ZAP_AND_SNYK.md).
3. **Pentest:** Scoped manual test on prod-like staging before major releases.
4. **Review:** Re-run **`docs/security/PROD-SECURITY-CHECKLIST.md`** after infra or auth changes.

## Quick verification commands (local)

```bash
cd apps/web
pnpm test
pnpm exec vitest run lib/security/__tests__/ lib/db/__tests__/database-url-ssl.test.ts
```

Production: **`GET /api/ready`**, Sentry test error, and one upload with scanner enabled.
