# Abuse control and rate limiting

Progressive hardening: start with **observability and basic limits** on the riskiest endpoints; escalate as abuse patterns appear. **Do not publish numeric limits as guarantees** without measuring your stack—they vary by deployment.

---

## Where rate limiting matters first

| Area | Risk | First-line control |
|------|------|---------------------|
| **Auth endpoints** (login, password reset, token refresh) | Credential stuffing, enumeration | Per-IP and per-account limits; exponential backoff on failures |
| **Message sending** | Spam, harassment automation | Per-user and per-conversation limits; cooldown |
| **Document upload** | Storage abuse, malware flood | Size caps, per-user/day quotas, content-type checks |
| **Scheduling / appointment creation** | Calendar spam | Per-user and per-resource limits |
| **Marketing lead capture** | Form spam, list bombing | Per-IP limits, honeypot, CAPTCHA when needed |
| **Internal / demo login** | Credential leak abuse | IP allowlist, separate credentials rotation, environment isolation |
| **Admin-sensitive actions** | Mass data exfiltration, destructive ops | Strong auth, MFA where applicable, per-admin limits, audit |

---

## Escalation path (later stages)

- **WAF** or edge rules for known bad IPs and patterns.
- **CAPTCHA** or proof-of-work on high-abuse public forms.
- **Tenant-level quotas** for API usage (enterprise feature).
- **Separate rate limit buckets** per tenant for noisy integrations.

---

## Anti-spam boundaries

- Throttle **notification generation** from automated sources (dedupe, cooldown).
- **Webhook idempotency** for payments to prevent duplicate side effects under retries.
- **Email sending** via provider with bounce/complaint handling; suppress bad addresses.

---

## Operational practices

- Log **429** and blocked events with reason code (without logging secrets).
- **Alert** when auth failure rate spikes globally (possible attack) vs single IP (possible user error).
- **Document** internal procedures for blocking abusive tenants or users.

---

## Relation to scaling stages

- **Stage 1:** Basic limits on auth and uploads; demo isolated.
- **Stage 2:** Broader coverage on messaging and scheduling; monitoring of limit hits.
- **Stage 3:** Tenant quotas, WAF integration, mature admin controls.

See [SCALING_PLAN](./SCALING_PLAN.md) and [OBSERVABILITY_SCALING](./OBSERVABILITY_SCALING.md).
