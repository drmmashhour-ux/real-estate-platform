# Incident response (production down or severely degraded)

Keep this short so it is usable under stress.

## When production breaks

### 1. Confirm in logs

- Vercel → **Project → Deployments** → latest **production** deployment → **Logs**.  
- Look for 5xx spikes, Prisma errors, Stripe webhook failures, auth errors.

See [vercel-logs.md](./vercel-logs.md).

### 2. Roll back immediately if the bad change is a recent deploy

- Use [vercel-rollback.md](./vercel-rollback.md) (Instant Rollback / Promote previous deployment).

### 3. Validate restored service

- Run [post-deploy-checklist.md](./post-deploy-checklist.md) on **production**.  
- Confirm `/api/health` and `/api/ready`.

### 4. Open a hotfix branch

- `hotfix/<short-description>` from the commit you want as base (often current `main` after revert, or pre-incident SHA).

### 5. Fix in preview

- Push `hotfix/*` → **Preview** URL.  
- Validate the full checklist on **preview** (and payments with **test** keys).

### 6. Re-promote only after QA

- Merge to `main` (or your protected release process).  
- Watch production deploy → run checklist again.

## Communication

- Post status (internal channel): impact, mitigation (rollback?), ETA for hotfix.  
- After resolution: short **postmortem** (what broke, why, preventive action).

## Related

- [branch-and-release-policy.md](./branch-and-release-policy.md)  
- [vercel-env.md](./vercel-env.md) — misconfigured env vars are a common cause of 503s.  
