# Recurring security review checklist

Use weekly (or per sprint) to keep risk visible. Check boxes as you go.

## GitHub

- [ ] **Code scanning** — New or unresolved CodeQL alerts triaged ([github-security.md](./github-security.md)).
- [ ] **Dependabot** — Critical/high dependency alerts addressed or scheduled.
- [ ] **Secret scanning** — No open valid-secret alerts; push protection still enabled.

## Snyk & dependencies

- [ ] **Snyk** dashboard reviewed for new issues on `main` snapshots ([snyk.md](./snyk.md)).
- [ ] **Dependabot PRs** merged or intentionally deferred with note.

## DAST / CI security workflows

- [ ] Latest **ZAP baseline** artifact reviewed if job ran ([zap.md](./zap.md)).
- [ ] **Gitleaks** / Snyk CI green on default branch (or failures owned).

## Application signals (Vercel + DB)

- [ ] **Failed login** trend — spike vs prior week (`/admin/security`).
- [ ] **Payment / webhook** failure counts — compare to baseline.
- [ ] **Vercel** — No unexplained 5xx or deploy failures ([vercel-alerting.md](./vercel-alerting.md)).

## Access and people

- [ ] **Admin access** — Still limited to intended users; offboarding completed for leavers.
- [ ] **Third-party integrations** — Unused OAuth apps removed.

## Follow-ups

Document open risks and owners in your issue tracker; link severe items to [incident-playbook.md](./incident-playbook.md).
