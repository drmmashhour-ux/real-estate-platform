# OWASP ZAP automated scans

Dynamic checks against a **deployed** base URL (staging, preview, or production — **only targets you own and are allowed to test**).

## Workflow

File: [`.github/workflows/security-zap.yml`](../../.github/workflows/security-zap.yml).

| Job | Purpose |
|-----|---------|
| **ZAP baseline** | Passive + spider against `ZAP_TARGET_URL`, `ZAP_PREVIEW_URL`, workflow input `target_url`, or a documented fallback. Produces an HTML report artifact. |
| **ZAP API scan** | Runs **only if** `apps/web/openapi.json` or repo-root `openapi.json` exists. Uses [action-api-scan](https://github.com/zaproxy/action-api-scan) with the OpenAPI file as the definition (attacks are driven from the spec; ensure `servers` in the spec point at a safe environment). |

## Configuration (GitHub Variables)

Set under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Purpose |
|----------|---------|
| `ZAP_TARGET_URL` | Default base URL for scheduled / push runs (e.g. staging). |
| `ZAP_PREVIEW_URL` | Optional dedicated preview hostname when different from `ZAP_TARGET_URL`. |
| `ZAP_FAIL_ON_FINDINGS` | Set to `true` to fail baseline on WARN/FAIL after triage and `.zap/rules.tsv` tuning. |
| `ZAP_API_FAIL_ON_FINDINGS` | Same for the API scan job. |

## Manual run

**Actions → Security — ZAP → Run workflow** — optionally set `target_url` to a **preview deployment URL** (e.g. Vercel preview) for PR-related testing.

## Reports

- Artifacts: `zap-baseline-report-<run_id>` and, when applicable, `zap-api-report-<run_id>`.
- Rule tuning: [`.zap/rules.tsv`](../../.zap/rules.tsv).

## Severity / failure policy

- Default: baseline does **not** fail the job unless `ZAP_FAIL_ON_FINDINGS=true` (noisy until tuned).
- API scan can be destructive to **test** data — run against non-production or disposable environments.

## Related

- [vercel-alerting.md](./vercel-alerting.md) — logs after deploy  
- [incident-playbook.md](./incident-playbook.md) — if a scan uncovers exploitable issues in prod  
