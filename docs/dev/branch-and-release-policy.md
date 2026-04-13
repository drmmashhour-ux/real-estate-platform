# Branch and release policy

This policy keeps **production** stable by routing all feature work through **preview deployments** first.

## Branch model

| Branch | Role |
|--------|------|
| **`main`** | Production. Only merged, reviewed, and preview-validated work. **Deploys to production on Vercel** when using the default Git integration. |
| **`dev`** | Long-running integration branch. Merge feature work here for combined QA; preview deploys validate the integrated state before `main`. |
| **`feature/*`** | All product work (e.g. `feature/bnhub-checkout-tweaks`). |
| **`hotfix/*`** | Urgent production fixes (e.g. `hotfix/stripe-webhook-500`). Still must pass preview validation before merging to `main`. |

## Rules

1. **Never merge unfinished or unreviewed work into `main`.**
2. **Every feature must produce a Vercel Preview deployment** from its branch (or from `dev` after merge) and be validated there before promoting to production.
3. **Production must only receive changes from `main`** (Vercel: Production Branch = `main`).
4. **Do not use “Deploy” from local CLI to production** for routine work; use the Git merge to `main` flow after preview QA.

## Non-destructive release rule

- **No large destructive changes** (migrations that drop data, broad auth changes, payment flow rewrites) go to production **without** a successful preview deployment and explicit review.
- If a change touches **more than 5–10 files heavily** (core flows, Prisma schema, Stripe, auth), require **manual review** (PR approval + checklist) before merging to `main`.

## Workflow summary

1. Branch from `dev` or `main` → `feature/...`.
2. Push → Vercel Preview URL for the branch.
3. Run through [post-deploy-checklist.md](./post-deploy-checklist.md) on the **preview** URL.
4. Open PR → `dev` (integration) and/or directly to `main` per team convention.
5. Merge to `main` only after validation → production deploy follows automatically (unless you use a [production hold](./vercel-deploy-flow.md)).
