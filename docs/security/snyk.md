# Snyk (CLI + CI)

[Snyk](https://snyk.io/) scans manifests and dependencies for known vulnerabilities and license issues. This repo runs the **official Snyk CLI** via `pnpm dlx snyk` in GitHub Actions — no global install required.

## Workflows

| Job | When | Purpose |
|-----|------|---------|
| **Snyk test** | Pull requests + pushes to `main` + weekly schedule | `snyk test --all-projects --severity-threshold=high` — **fails the job** if issues meet threshold (when `SNYK_TOKEN` is set). |
| **Snyk monitor** | After successful test on **`main`** only | `snyk monitor --all-projects` — registers snapshots in the Snyk UI for continuous monitoring and email/Slack alerts. |

Workflow file: [`.github/workflows/snyk.yml`](../../.github/workflows/snyk.yml).

## Authentication in CI

1. Create a Snyk account and obtain an API token: **Snyk → General → Auth token** (or service account for teams).
2. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**  
   - Name: `SNYK_TOKEN`  
   - Value: the token string.
3. **Fork PRs:** Secrets are not available to workflows from forks; the job **skips** with a notice (exit 0). Run Snyk locally or rely on upstream PR checks from the main repo.

## Local usage

```bash
pnpm install
pnpm dlx snyk@latest auth   # once per machine / token
pnpm dlx snyk@latest test --all-projects
pnpm dlx snyk@latest monitor --all-projects   # optional: register project
```

## Severity and policy

- CI uses `--severity-threshold=high` to reduce noise; tighten or loosen in the workflow after triage.
- For monorepos, `--all-projects` discovers `package.json` workspaces under the root lockfile.

## Artifacts

On each run, a JSON report `snyk-report.json` is uploaded when generated (**Actions → workflow run → Artifacts**).

## Related docs

- [github-security.md](./github-security.md) — Dependabot vs Snyk roles  
- [alert-routing.md](./alert-routing.md) — Snyk notification destinations  
