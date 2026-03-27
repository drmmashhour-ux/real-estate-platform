# Team workflow (BNHub / LECIPM)

How we work together: branches, reviews, CI, releases, and commit style. For Git mechanics and hooks, see **`docs/git-workflow.md`** and **`docs/git-rules.md`**. For new developers, start with **`docs/onboarding.md`**.

---

## 1. Branch strategy

| Branch | Purpose |
|--------|---------|
| **`main`** | Production — **protected**; only updated via reviewed PRs (usually from `develop` or hotfix). |
| **`develop`** | Staging / integration — default target for feature work; kept deployable. |
| **`feature/*`** | New features (e.g. `feature/auth-system`, `feature/payment-flow`). |
| **`fix/*`** | Non-urgent bug fixes (e.g. `fix/login-error`). |
| **`hotfix/*`** | Urgent production fixes branched from `main`, merged back to `main` and `develop`. |

**Naming:** use lowercase, hyphens, short scope: `feature/short-description`, `fix/issue-scope`.

---

## 2. Branch protection (GitHub settings — document, then enforce)

Configure in **GitHub → Repository → Settings → Branches → Branch protection rules** for **`main`** (and optionally **`develop`**):

| Rule | Why |
|------|-----|
| **No direct pushes** | Everyone uses PRs; history stays auditable. |
| **Pull request required** | Code review before merge. |
| **Require status checks to pass** | Enable **`CI`** (or your workflow name) so **lint + build** must succeed. |
| **Require approvals (≥ 1)** | At least one reviewer before merge. |
| **Dismiss stale approvals** (optional) | New commits re-request review. |
| **Include administrators** (recommended for `main`) | Admins follow the same rules. |

**`develop`:** same CI requirement; approvals can be 1 and slightly lighter if the team agrees.

> **Note:** Branch protection is not stored in git; a repo admin must apply these once. This doc is the source of truth for what to configure.

---

## 3. Pull requests

- Open PRs **into `develop`** for normal work; **into `main`** for releases or hotfixes (per release flow below).
- Use the [PR template](../.github/pull_request_template.md) (auto-loaded on GitHub).
- Keep PRs small when possible; link tickets/issues if you use them.

---

## 4. Commit message standard

Use **[Conventional Commits](https://www.conventionalcommits.org/)**-style prefixes:

| Prefix | When |
|--------|------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Behavior-preserving code change |
| `docs:` | Documentation only |
| `chore:` | Maintenance, tooling, deps |
| `test:` | Tests only |
| `ci:` | CI configuration |

**Optional scope:** `feat(bnhub): add guest favorites`

**Examples:**

```text
feat: add host calendar range filter
fix: correct quote total when cleaning fee is zero
refactor: extract listing search where builder
docs: team workflow and onboarding
chore: bump eslint to 9.x
```

A **commit-msg hook** (see `.husky/commit-msg`) enforces this locally; merge commits are allowed.

---

## 5. CODEOWNERS

File: **`.github/CODEOWNERS`**. Replace `@YOUR_ORG/team` placeholders with real **GitHub Organization teams** (or `@username`). Then enable **Require code owner reviews** on `main` if you want owners to approve changes in their areas.

---

## 6. CI enforcement

Workflow: **`.github/workflows/ci.yml`**

- Runs on **pull requests** and on **push** to `main` / `develop`.
- **Lint** and **build** must pass — merge should be blocked if the workflow fails (via branch protection).

Locally: `pnpm install`, `pnpm run lint`, `pnpm run build:ci` before pushing when touching shared code.

---

## 7. Local development standard

From the repo root:

```bash
pnpm install
pnpm dev              # default: web app
pnpm run dev:platform # web + admin in parallel (when needed)
```

Copy **`apps/web/.env.example`** (and others per app/service) to **`.env`** locally — never commit real secrets. See root **`.env.example`** for pointers.

---

## 8. Environment and secrets

- **No real API keys, passwords, or tokens** in the repository.
- Each developer maintains a local **`.env`** (gitignored).
- Commit only **`.env.example`** files with dummy/placeholder values and comments.

---

## 9. Release flow (high level)

Detailed steps, staging DB, rollback, and monitoring: **`docs/release-strategy.md`**.

1. **`develop`** is tested on **staging** (deploy + QA).
2. Open a **release PR**: `develop` → **`main`**.
3. After review + green CI + approvals, **merge to `main`** → **production** deploy.

**Hotfix:** branch `hotfix/...` from `main`, fix, PR to `main`, then merge `main` → `develop` so staging stays aligned.

---

## 10. Error prevention (summary)

| Layer | What |
|-------|------|
| **`.gitignore`** | Keeps `node_modules`, build dirs, `.env` out of commits. |
| **Pre-commit** | Forbidden paths + 50MB limit + lint-staged guard. |
| **Commit-msg** | Conventional commit prefix enforcement. |
| **CI** | Lint + build on every PR. |
| **Branch protection** | PR + approval + required checks on `main`. |

---

## 11. Simulation checklist (team readiness)

- [ ] Developer A: `git checkout develop && git pull && git checkout -b feature/demo-task`
- [ ] Developer B: same from latest `develop` on another branch — no force-push to shared branches.
- [ ] Open PR → CI runs → fix failures if any → request review.
- [ ] Approver merges only when green + checklist done.
- [ ] `main` receives changes only via protected merge.

---

## Readiness

When branch protection and CODEOWNERS are configured in GitHub, this workflow is **ready for multi-developer production**. Until then, treat this document as the **agreed process** and follow it manually.
