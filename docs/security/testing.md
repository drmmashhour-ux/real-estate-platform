# Security-focused testing

## Automated (repo)

- **Validators:** `apps/web/lib/security/__tests__/validators.test.ts` (Vitest) — UUID, email, JSON body parsing.
- **Auth:** `apps/web/app/api/auth/login/route.test.ts` — existing coverage; extend for rate-limit behavior in CI as needed.

## Manual / E2E scenarios

Run against **Preview** URL with test credentials and Stripe test mode.

| Scenario | Expect |
|----------|--------|
| **Unauthorized API** | `401`/`403` without valid session on protected routes |
| **Role escalation** | Non-admin cannot access `/api/admin/*` mutations |
| **Cross-user access** | User A cannot fetch user B’s booking/message by ID (403 or empty) |
| **Invalid UUID** | `400` on malformed route params where validated |
| **Webhook without signature** | Stripe webhook returns `400` / missing header |
| **Rate limit** | Burst requests to login/register return `429` with retry headers |
| **Kill switch** | With `PLATFORM_DISABLE_PUBLIC_SIGNUP=1`, register returns `503` |

## Related

- [security-audit.md](./security-audit.md)  
