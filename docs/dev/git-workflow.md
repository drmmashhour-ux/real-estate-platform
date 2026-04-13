# Git workflow & rollback (LECIPM platform)

This document describes a **safe, non-destructive** branching model, backup habits, rollback options, tagging, and local checks. It complements automated CI (see `.github/workflows/ci.yml` and `docs/ci-policy.md`).

---

## 1. Branch strategy

| Branch | Purpose |
|--------|---------|
| **`main`** | Production-aligned code (protected: no direct commits). |
| **`dev`** (or team **`develop`**) | Integration / staging — merge feature work here before production. This repo’s CI also runs on **`develop`**; align the integration branch name with your team. |
| **`feature/*`** | All normal product work (e.g. `feature/admin-assistant`, `feature/bnhub-pricing`). |
| **`hotfix/*`** | Urgent production fixes (e.g. `hotfix/stripe-webhook`), branched from `main` when possible. |

**Merge flow (target):**

```text
feature/*  →  dev (integration)  →  main (production)
hotfix/*   →  main  →  backport to dev
```

**Rules:**

- Do **not** commit directly to `main`.
- Do **all** changes in **`feature/*`** (or `hotfix/*` for emergencies).
- Open **pull requests** into `dev` first; promote `dev` → `main` when release-ready.

---

## 2. Backup before risky work

Before large refactors, migrations, or merges:

1. Note current commit: `git rev-parse HEAD`
2. Create a **backup branch** at this commit (published to remote):

```bash
./scripts/git-backup-branch.sh my-migration-work
git push -u origin "backup/$(date +%Y%m%d)-my-migration-work"   # use the printed branch name
```

Or manually:

```bash
git branch backup/manual-$(date +%Y%m%d) HEAD
git push -u origin backup/manual-$(date +%Y%m%d)
```

Backups are cheap; they enable **instant comparison** and **reset-to-backup** without rewriting shared history (prefer new backup branch over `reset --hard` on shared branches).

---

## 3. Rollback options

### A. `git revert` (preferred on shared branches)

Safe for **`main`** / **`dev`**: adds new commits that undo a bad change without history rewrite.

```bash
git revert <sha>                 # single commit
git revert <oldest_sha>^..<newest_sha>   # range (careful with conflicts)
git push origin main
```

Use for: bad deploy already pushed, need audit trail.

### B. Tag-based rollback (deploy known version)

Tags mark **known-good** releases. Checkout or deploy the tag in your hosting pipeline (e.g. Vercel production pin).

```bash
git fetch --tags
git checkout v1.1
# or deploy v1.1 from CI / hosting UI
```

### C. `git reset --hard` (local or **only** if branch is not shared)

**Dangerous** on branches others use — avoid on `main`/`dev`.

```bash
git reset --hard <good-sha>
```

Use for: **local** branch only, or after explicit team agreement to rewrite a non-shared branch.

### D. Restore from backup branch

```bash
git checkout your-feature-branch
git reset --hard backup/20260402-my-work
```

---

## 4. Version tags

Create **annotated** tags at release points (examples — adjust to your semver):

```bash
git tag -a v1-launch-ready -m "Launch-ready baseline"
git tag -a v1.1 -m "Release 1.1"
git tag -a v1.2 -m "Release 1.2"
git push origin v1-launch-ready v1.1 v1.2
```

List tags: `git tag -l 'v*' --sort=version:refname`

Rollback in production = **redeploy the tag** or revert commits after the tag.

---

## 5. Pre-commit / pre-push checks (local)

Run the same class of checks CI runs before pushing (integrity → typecheck → web build):

```bash
pnpm git:verify
```

**Optional** — include web ESLint (may fail while backlog is cleaned; see `docs/ci-policy.md`):

```bash
pnpm git:verify:with-lint
```

**Manual sequence** (equivalent to `git:verify`):

```bash
pnpm ci:integrity
pnpm ci:typecheck
pnpm ci:build
```

---

## 6. CI (continuous integration)

Pull requests and pushes to configured branches run **`.github/workflows/ci.yml`**: install, Prisma validate, integrity gate, typecheck, Next.js production build, platform validations.

ESLint as a **hard gate** may be enabled later per `docs/ci-policy.md`; do not rely on “lint green” alone until policy says so.

---

## 7. Commit rules (summary)

- Small, focused commits; reference issue/ticket when applicable.
- No secrets in commits (use env / secrets stores).
- Prefer **PR review** for `dev` and **required review** for `main` (configure in GitHub branch protection).

---

## 8. Quick reference

| Goal | Command |
|------|---------|
| Safe local gate | `pnpm git:verify` |
| Backup branch | `./scripts/git-backup-branch.sh <label>` then `git push -u origin <branch>` |
| Undo pushed bad commit | `git revert <sha>` |
| Deploy old known version | Checkout / deploy **tag** `v1.x` |
| See CI policy | `docs/ci-policy.md` |

---

## Success criteria

- **main** stays stable; work lands via **feature → dev → main**.
- **Backups** and **tags** give fast recovery paths.
- **Revert** preferred over **reset** on shared branches.
- **Local `pnpm git:verify`** catches most issues before CI.
