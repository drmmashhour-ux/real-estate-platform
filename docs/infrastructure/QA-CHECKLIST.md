# LECIPM Infrastructure v1 — QA checklist

Run before production cutover:

## Auth & roles

- [ ] Sign in works (cookie session / DB user).
- [ ] Unauthenticated requests to protected APIs return **401**.
- [ ] `requireRole('admin')` / broker / host return **403** when role does not match.

## Data & RLS

- [ ] No secret keys in browser bundle (inspect build output / network).
- [ ] Storage uploads go through **server** routes only; paths are validated.

## Payments

- [ ] Stripe Checkout creates session server-side.
- [ ] Webhook receives events; payment confirmed only after webhook + DB update.
- [ ] Idempotent replay does not double-charge or duplicate booking (see webhook inbox / logs).

## Ops

- [ ] `GET /api/health?deep=1` → DB connected, Stripe valid, Supabase reachable (if configured).
- [ ] `GET /api/ready` → `ready: true`.
- [ ] `pnpm --filter @lecipm/web run predeploy:check` passes on CI.
- [ ] `postdeploy:test` against staging URL passes.

## Readiness

**GO** only if all critical boxes are checked and staging smoke tests pass.
