# Pull request and release security gates

This complements [ci-policy.md](../ci-policy.md): **what must pass** before merging or releasing, including security automation.

## Required automation (intended)

| Check | Workflow | Blocks merge? |
|-------|----------|----------------|
| Integrity, typecheck, build, platform validations | [`ci.yml`](../../.github/workflows/ci.yml) | Yes — configure as **required status check** in branch protection |
| CodeQL | [`codeql.yml`](../../.github/workflows/codeql.yml) | Recommended for `main` |
| Snyk test | [`snyk.yml`](../../.github/workflows/snyk.yml) | Recommended when `SNYK_TOKEN` is set |
| Gitleaks | [`gitleaks.yml`](../../.github/workflows/gitleaks.yml) | Recommended |
| ZAP | [`security-zap.yml`](../../.github/workflows/security-zap.yml) | Optional (scheduled / manual / post-merge) |

**Note:** ESLint is not a global gate yet ([ci-policy.md](../ci-policy.md)); security linting should still be done when touching sensitive paths.

## Release-blocking security conditions (policy)

Merging or deploying **production** should be blocked or rolled back when:

1. **Critical** or **high** Snyk / Dependabot findings in **production dependencies** without mitigation.
2. **Valid** secret scanning or Gitleaks finding in the default branch.
3. **Confirmed** auth or payment regression from CI / staging.
4. **Open S1/S2** incident without containment ([incident-playbook.md](./incident-playbook.md)).

ZAP baseline **warnings** are triage items, not automatic blockers, until `ZAP_FAIL_ON_FINDINGS` is enabled after tuning.

## GitHub configuration checklist

- [ ] Branch protection on `main`: require PR, reviews, **required checks** (CI + chosen security jobs).
- [ ] `SNYK_TOKEN` present for full Snyk runs.
- [ ] Code scanning and Dependabot enabled ([github-security.md](./github-security.md)).
