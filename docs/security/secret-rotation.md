# Secret rotation and hygiene

What to rotate when something leaks or GitHub **secret scanning** / **Gitleaks** flags a credential.

## General response

1. **Revoke** the credential at the provider (invalidate old token/key).
2. **Issue** a new secret; store only in **Vercel env**, GitHub **Secrets**, or your vault — never commit.
3. **Redeploy** so runtime picks up new values.
4. **Audit** access logs at the provider (Stripe, Supabase, etc.) for misuse window.
5. **Dismiss** or **resolve** the GitHub alert after verification.

## Stripe

| Secret | Where | Rotation |
|--------|-------|----------|
| `STRIPE_SECRET_KEY` | Vercel / server | Dashboard → Developers → API keys — roll restricted key or create new secret key. |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | Vercel | For each endpoint, **Roll secret** or recreate endpoint; update env; redeploy. |
| `STRIPE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_*` | Rotate in Dashboard; safe to expose but still update if compromised. |

After rotation, send a **test webhook** from Stripe Dashboard.

## Supabase

- **Service role key** — Full DB access: rotate in Supabase **Settings → API**; update all server envs immediately.
- **Anon key** — Rotate if embedded in a leaked client bundle; update `NEXT_PUBLIC_*` and redeploy.
- **Review** RLS policies if anon key was exposed ([rls-policies.md](./rls-policies.md)).

## Social / OAuth / third-party APIs

- Revoke app tokens in the provider (Google, Facebook, etc.).
- Regenerate client secret; update OAuth callback URLs if needed.
- Invalidate user sessions if tokens could be replayed.

## Database URLs

- If `DATABASE_URL` leaks: **rotate password** on Neon/host; update Vercel; check connection logs for foreign IPs.

## GitHub secret scanning alert

1. Assume the string was in git history — **revoke** the secret even after removing the commit.
2. Use `git filter-repo` or GitHub support for history cleanup **only if** policy requires (revocation is mandatory either way).
3. Enable **push protection** to prevent recurrence ([github-security.md](./github-security.md)).

## Ongoing hygiene

- Prefer **short-lived** tokens and **scoped** API keys.
- No secrets in `NEXT_PUBLIC_*`.
- Run [review-checklist.md](./review-checklist.md) weekly.
