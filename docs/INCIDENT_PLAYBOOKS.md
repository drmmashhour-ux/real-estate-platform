# Incident playbooks

Short, **step-by-step** responses. Escalate to the security team for suspected breaches.

---

## A. System down

1. **Check status** of hosting (Vercel, AWS, etc.) and **DNS**.
2. **Check logs** (structured JSON) for errors in the last deploy window.
3. **Hit** `GET /api/health` (process up) and `GET /api/ready` (DB up).
4. If **DB down** — follow **B. Database issue**.
5. If **app only** — consider **rollback** (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
6. **Communicate** status to stakeholders; open incident doc with timeline.

---

## B. Database issue

1. **Verify** `DATABASE_URL` and provider status (RDS/Supabase dashboard).
2. **Connection pool** — check max connections / idle timeouts if errors mention pool exhaustion.
3. **Restore** — only if data is corrupt; follow [RESTORE_PROCEDURE.md](./RESTORE_PROCEDURE.md) (**staging first**).
4. **Integrity** — run tenant/finance integrity scripts if available (`apps/web/scripts/…`).

---

## C. Payment issues

1. **Check** payment provider dashboard (Stripe) for failed webhooks and API errors.
2. **Review** logs for **webhook** routes (`/api/.../webhook`) — never double-apply events; rely on **idempotency keys**.
3. **Reconcile** invoices vs payments for affected period.
4. **Prevent duplicate charges** — do not retry blindly; confirm event IDs in DB.

---

## D. Data integrity issue

1. **Identify scope** — one tenant vs global.
2. **Run** integrity checks (tenant/finance scripts if present).
3. **Isolate tenant** — disable destructive actions if needed (feature flags / admin).
4. **Repair** only if **deterministic** (scripted fix with rollback plan); else restore from backup.

---

## E. Security incident

1. **Revoke** compromised sessions and **rotate** keys (`CRON_SECRET`, API keys, DB password).
2. **Audit** logs for suspicious `auth` and **admin** routes.
3. **Preserve** evidence (log exports, timeline).
4. **Notify** customers if required by law / policy.
