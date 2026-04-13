# Safe deployment flow (Vercel)

This is the **recommended workflow** for the platform: preview first, validate, then production.

## Preconditions

- **Git:** `main` = production; feature work on `feature/*` or integrated on `dev` ([branch-and-release-policy.md](./branch-and-release-policy.md)).
- **Vercel:** Project linked to the repo; **Production Branch** = `main`; Preview deployments enabled for other branches.
- **Env:** Production vs Preview variables set per [vercel-env.md](./vercel-env.md).

## Standard flow

1. **Push a feature branch** (or open a PR).  
   Vercel creates a **Preview Deployment** with a unique URL.

2. **Open the Preview URL** from the Vercel dashboard or Git check run.

3. **Validate on Preview** — run [post-deploy-checklist.md](./post-deploy-checklist.md) against the preview URL (not production).

4. **Merge to `main`** only after review and checklist pass.  
   Merging to `main` triggers the **Production** deployment (default Git integration behavior).

5. **Re-run smoke checks** on the **production** URL after the deployment finishes.

## What “promote” means here

Vercel does not require a separate “promote” step for the default Git flow: **the deployment that built from `main` is production**. “Promotion” in practice means:

- **Merging validated work to `main`**, or  
- **Rolling forward** by merging a fix after a bad deploy (or using rollback — [vercel-rollback.md](./vercel-rollback.md)).

## Optional: production hold (manual release)

Some teams want **builds on `main` without immediately switching production traffic**, or want an explicit button step. Vercel’s product evolves; options include:

1. **Protected branches + manual merge**  
   Only release managers merge to `main` after QA on preview, so production deploys only when that merge happens.

2. **Separate “staging” project**  
   A second Vercel project deploys `main` to a staging domain; production project is updated only after staging sign-off (duplicate env maintenance).

3. **Vercel features**  
   Check current docs for **Skew Protection**, **Instant Rollback**, and deployment **Promote** if your plan includes them.

**Document your team’s choice** in the README or runbook so everyone knows whether production tracks `main` automatically or requires an extra step.

## CLI vs Git (avoid risky prod deploys)

- Prefer **merge to `main`** to update production.  
- Avoid routine `vercel --prod` from a laptop unless that is your documented release process — it bypasses PR review and branch protection if misused.

## Related

- [vercel-rollback.md](./vercel-rollback.md)  
- [vercel-logs.md](./vercel-logs.md)  
- [incident-response.md](./incident-response.md)  
