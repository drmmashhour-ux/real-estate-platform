# Release security checklist

Tie together **secure release** and **deployment safety**. Deployment flow: [../dev/vercel-deploy-flow.md](../dev/vercel-deploy-flow.md). Branch policy: [../dev/branch-and-release-policy.md](../dev/branch-and-release-policy.md).

## Before merging to `main`

- [ ] PR reviewed for **authz** on changed API routes (ownership, role).
- [ ] No new `NEXT_PUBLIC_*` for secrets.
- [ ] Preview deployment tested with **Preview env** (test Stripe, non-prod DB).
- [ ] Large or destructive changes (schema, payments, auth) have explicit reviewer sign-off (**5–10+ file** sensitive touch rule per team policy).

## After production deploy

- [ ] [post-deploy checklist](../dev/post-deploy-checklist.md) on production URL.
- [ ] `/api/health` and `/api/ready` return 200.
- [ ] Spot-check Stripe webhook delivery in Stripe Dashboard (test event or live monitoring).
- [ ] Scan Vercel logs for spikes in 401/403/429 on auth routes.

## Rollback readiness

- [ ] Team knows where **Deployments** and **Rollback** live in Vercel ([../dev/vercel-rollback.md](../dev/vercel-rollback.md)).

## Related

- [README.md](./README.md)  
- [../dev/post-deploy-checklist.md](../dev/post-deploy-checklist.md) — operational smoke checks.  
