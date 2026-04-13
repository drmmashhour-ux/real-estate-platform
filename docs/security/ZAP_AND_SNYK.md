# OWASP ZAP & Snyk (CI + local)

This repo includes GitHub Actions workflows aligned with **pnpm** and **Node 20**.

## GitHub Actions

| Workflow | File | When it runs |
|----------|------|----------------|
| **Snyk** | `.github/workflows/snyk.yml` | `push` to `main`, weekly schedule, **Run workflow** |
| **ZAP Baseline** | `.github/workflows/zap-baseline.yml` | `push` to `main`, weekly schedule, **Run workflow** |

### GitHub checklist (you configure in the UI)

| Name | Type | Purpose |
|------|------|--------|
| `SNYK_TOKEN` | **Secret** | Snyk API token (never commit). |
| `ZAP_TARGET_URL` | **Variable** | Staging (or test) base URL for ZAP; used on `push` to `main` and on schedule when dispatch input is empty. |
| `ZAP_FAIL_ON_FINDINGS` | **Variable** | Set to `true` to fail the ZAP job when the baseline reports WARN/FAIL-level alerts (not the same as Snyk “critical CVE” severities). Leave unset or `false` until `.zap/rules.tsv` triage is done. |

Path: **Settings** → **Secrets and variables** → **Actions** → **Secrets** or **Variables**.

### Snyk — setup

1. Create a Snyk account and an API token: [Snyk authentication](https://docs.snyk.io/snyk-api-info/authentication-for-api).
2. Add **`SNYK_TOKEN`** under **Secrets** (not Variables).
3. On the next `push` to `main` or manual run, the workflow installs deps with `pnpm install --frozen-lockfile` and runs:

   `pnpm dlx snyk@latest test --all-projects --severity-threshold=high`

If `SNYK_TOKEN` is **missing** (e.g. fork without secrets), the job **skips** Snyk with a notice (does not fail).

**Artifact:** `snyk-report.json` when the test produces one (uploaded even if the step fails on findings).

**Tighten policy:** Lower `--severity-threshold` (e.g. `medium`) after fixing high issues. Add `snyk monitor` in a separate scheduled job if you want continuous Snyk.io project tracking.

### ZAP Baseline — setup

1. Prefer a **staging** URL over production. Add **`ZAP_TARGET_URL`** under **Variables** (no trailing slash). Resolution order is: **non-empty manual input** → **`ZAP_TARGET_URL`** → **workflow fallback** (`https://app.lecipm.com` unless you change it in YAML).
2. **Manual run:** **Actions** → **ZAP Baseline** → **Run workflow** — leave **target URL** empty to scan `ZAP_TARGET_URL` (same as push/schedule), or enter a URL to override for that run only.
3. **Push to `main`** and **weekly schedule** use `ZAP_TARGET_URL` → fallback (no dispatch input).

**Strict CI (optional):** Add variable **`ZAP_FAIL_ON_FINDINGS`** = `true` to set `fail_action: true` on the baseline scan (job fails when ZAP reports WARN/FAIL-level alerts). Leave unset or `false` while you are still triaging noise.

**Suppressions:** Edit **`.zap/rules.tsv`** (tab-separated). The workflow checks out the repo so this file is available to the action. See [ZAP baseline configuration](https://www.zaproxy.org/docs/docker/baseline-scan/#configuration-file).

**Artifact:** `zap-baseline-report` (HTML when generated).

**GitHub issues:** The workflow sets **`allow_issue_writing: false`** so results stay in logs + artifacts. Remove that input in `.github/workflows/zap-baseline.yml` if you want the ZAP action to open/update issues.

---

## Local commands (developer machine)

### Snyk

```bash
# One-off (no global install)
cd /path/to/real-estate-platform
pnpm install --frozen-lockfile
pnpm dlx snyk@latest auth   # paste token when prompted
pnpm dlx snyk@latest test --all-projects --severity-threshold=high
```

### OWASP ZAP (GUI)

1. Install [ZAP](https://www.zaproxy.org/download/).
2. Start ZAP, point **Manual Explore** or **Automated Scan** at your target (staging).
3. **Report** → Generate HTML report.

### ZAP (Docker baseline, quick)

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://YOUR_STAGING_URL -r zap-report.html
```

---

## Related

- `docs/security/SECURITY-POSTURE-SUMMARY.md` — how this fits the rest of hardening.
- `docs/security/INCIDENT-RESPONSE.md` — if a scan finds a confirmed issue.
