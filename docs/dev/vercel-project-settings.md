# Vercel project settings checklist

Use this when onboarding a new project or auditing production safety. **Values are verified in the Vercel dashboard** — this file cannot read your account.

## Repository link

- [ ] **Git** integration connected to the correct GitHub/GitLab/Bitbucket repo.
- [ ] **Root directory** (if monorepo): points at the app Vercel builds (e.g. `apps/web` or repo root per your `vercel.json` location).

## Branches and deployments

- [ ] **Production Branch** = `main` (or your documented production branch — must match [branch-and-release-policy.md](./branch-and-release-policy.md)).
- [ ] **Preview deployments** enabled for branches/PRs (non-production).
- [ ] **Ignored build step** (if any) does not skip required builds on `main`.

## Environment variables

- [ ] **Production** scope has production DB URL, live Stripe (if applicable), and `NEXT_PUBLIC_APP_URL` for the production domain.
- [ ] **Preview** scope uses **test** Stripe keys and a **non-production** database (or Neon branch) where possible ([vercel-env.md](./vercel-env.md)).
- [ ] **Development** (optional) for `vercel dev` local parity.
- [ ] No secret copied into a `NEXT_PUBLIC_*` variable.

## Domains

- [ ] Production domain attached to the **Production** deployment target.
- [ ] Preview URLs use the default `*.vercel.app` or team preview domain.

## After changes

- Trigger a **test deploy** on a branch and confirm a Preview URL appears.
- Merge a trivial change to `main` (or use existing process) and confirm Production updates.

## Related

- [vercel-deploy-flow.md](./vercel-deploy-flow.md)  
- [vercel-env.md](./vercel-env.md)  
