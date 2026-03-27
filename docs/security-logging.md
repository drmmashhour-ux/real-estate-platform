# Security-aware logging

## Current behavior

- `apps/web/lib/logger.ts` routes `logInfo` / `logError` through **`redactForLog`** / **`redactSensitiveText`** (`lib/security/redact.ts`) to strip common token patterns (Bearer, `sk_*`, `whsec_*`, naive `password=` / `api_key=` patterns).

## Practices

1. **Do not log** raw request bodies for auth or payment routes.
2. **Do not log** webhook signing secrets, full Stripe events containing PII, or card data (Stripe should not send PAN to your logs if integrated correctly).
3. Prefer **structured fields** without secrets: `userId`, `event.type`, `paymentIntentId` (opaque id), outcome.
4. **Trust / admin actions**: use existing audit tables (`bnhubIdentityAuditLog`, etc.) where implemented; add server-side audit rows for sensitive mutations.

## Production errors

- API routes should return **generic** messages to clients in production; log details server-side only (redacted).
- Stripe webhook misconfiguration responses avoid exposing internal env filenames in production (`apps/web/app/api/stripe/webhook/route.ts`).
