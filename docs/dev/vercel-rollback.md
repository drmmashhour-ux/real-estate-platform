# Rollback on Vercel

When production misbehaves after a deploy, **rollback first**, then debug. This document describes two practical paths.

## A. Fast rollback (instant previous deployment)

Use this when the **latest** production deployment is bad and the **previous** one was good.

### Dashboard

1. Open **Vercel → your Project → Deployments**.
2. Find the **current production** deployment (production domain badge).
3. Open the **previous** successful deployment (the one before the bad one).
4. Use **⋯ (menu) → Promote to Production** or **Rollback** (wording depends on Vercel version).  
   This points production traffic at that earlier build.

### CLI

```bash
# List recent deployments (get deployment URL or ID)
vercel ls

# Rollback production to previous deployment (see `vercel rollback --help` for current syntax)
vercel rollback
```

> **Note:** Exact CLI flags change over time. Run `vercel rollback --help` and check [Vercel rollback documentation](https://vercel.com/docs/deployments/instant-rollback) for the current command.

### After rollback

1. Confirm [post-deploy-checklist.md](./post-deploy-checklist.md) on the **production** URL.  
2. Confirm `/api/health` and `/api/ready` on production.  
3. Follow [incident-response.md](./incident-response.md) for a hotfix branch and preview validation before merging again.

---

## B. Promote a known-good deployment

Use this when you know **which** deployment ID or URL was stable (not necessarily “the previous one”).

### Dashboard

1. **Vercel → Project → Deployments**.
2. Filter or search for the **known good** deployment (time, commit SHA, or branch).
3. Open it → **Promote to Production** (or equivalent).

### CLI

```bash
vercel ls
# Copy the deployment URL or ID you trust, then:
vercel promote <deployment-url-or-id>
```

Confirm the production domain now serves that deployment, then run smoke checks.

---

## Git-level rollback (optional)

Rollback in Vercel **does not** revert `main` in Git. For a permanent fix:

- Revert the bad commit on `main` (`git revert`) and push, **or**  
- Fix forward on a `hotfix/*` branch, validate in Preview, merge to `main`.

Keep Vercel rollback for **immediate** traffic recovery; use Git for **source of truth**.

## Related

- [vercel-logs.md](./vercel-logs.md) — find what failed before rolling back.  
- [vercel-command-reference.md](./vercel-command-reference.md)  
