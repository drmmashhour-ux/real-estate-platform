# Onboarding — BNHub / LECIPM monorepo

Welcome. Follow these steps to run the platform locally and ship your first change safely.

---

## 1. Prerequisites

- **Node.js 20+** ([nodejs.org](https://nodejs.org/) or `nvm`)
- **pnpm 9** — `corepack enable && corepack prepare pnpm@9.15.4 --activate` (or install from [pnpm.io](https://pnpm.io/installation))
- **Git** with SSH or HTTPS access to the GitHub repo

---

## 2. Clone and install

```bash
git clone <repository-url>
cd real-estate-platform
pnpm install
```

`pnpm install` runs the **`prepare`** script and sets up **Husky** (pre-commit hooks).

---

## 3. Environment variables

1. Read the root **`.env.example`** — it points to app-specific templates.
2. For the main web app, copy **`apps/web/.env.example`** → **`apps/web/.env`**.
3. Fill in **local-only** values (database URL, keys from your team’s secret manager — **never commit** `.env`).

---

## 4. Run the project

```bash
# Main web app (http://localhost:3000 by default)
pnpm dev

# Web + admin together (when you work on both)
pnpm run dev:platform
```

Other apps: see root **`package.json`** scripts (`dev:admin`, `dev:mobile`, etc.).

---

## 5. Create a branch

We use **`develop`** for integration. Do **not** commit directly to **`main`**.

```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feature/your-short-task-name
```

Examples: `feature/auth-system`, `fix/login-error`. See **`docs/team-workflow.md`**.

---

## 6. Before you commit

- Run **`pnpm run lint`** (and **`pnpm run build:ci`** for larger changes).
- Use commit messages like **`feat: ...`**, **`fix: ...`**, **`docs: ...`** (see **`docs/team-workflow.md`**).
- Hooks block **`node_modules`**, build folders, and files **> 50MB**.

---

## 7. Open a pull request

1. Push your branch: `git push -u origin feature/your-short-task-name`
2. On GitHub, open a **Pull Request** into **`develop`** (unless your team directs otherwise).
3. Fill in the PR template; wait for **CI** (green checks) and **review**.

---

## 8. Where to read next

| Doc | Topic |
|-----|--------|
| **`docs/team-workflow.md`** | Branches, releases, CI, protection rules |
| **`docs/onboarding-team.md`** | Team process: repo map, how to contribute (beyond dev setup) |
| **`docs/team-structure.md`** | Roles, hierarchy, scaling |
| **`docs/release-strategy.md`** | Staging vs production, deploy, rollback, hotfixes |
| **`docs/cicd.md`** | GitHub Actions, Vercel, env vars |
| **`docs/git-workflow.md`** | Hooks, safe Git commands, large files |
| **`docs/git-rules.md`** | What not to commit |

Questions: ask in your team channel and update this doc if something is unclear.
