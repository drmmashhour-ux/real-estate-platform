# GitHub security baseline

This document describes **built-in GitHub capabilities** for the repository and how the team uses them. Most toggles live under **Settings → Code security and analysis** (organization owners may manage at org level).

## Code scanning (CodeQL)

- **What it does:** Static analysis for JavaScript/TypeScript (and other languages if configured) to find common vulnerability classes.
- **Where it runs:** Workflow [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) on pushes and pull requests to `main` / `develop`, plus a weekly schedule.
- **Where alerts appear:** **Security → Code scanning alerts** for the repository.
- **Who reviews:** Engineering on-call or the engineer who owns the touched area; critical/high findings should be triaged within one business day.
- **When triggered:** On each relevant workflow run; alerts update when the default branch changes.

### What to do when an alert fires

1. Open the alert, read the **location** and **data flow** (if shown).
2. Confirm whether it is a true positive in **our** code (not a dependency we only consume).
3. Fix in a focused PR, or dismiss with **documented reason** (false positive, risk accepted with ticket).
4. For accepted risk, record in the weekly [review checklist](./review-checklist.md).

## Secret scanning (GitHub)

- **What it does:** Detects known secret patterns in **pushed** content when enabled for the repo/org.
- **Where alerts appear:** **Security → Secret scanning alerts**.
- **Who reviews:** Same as code scanning; secrets require **immediate** rotation if valid (see [secret-rotation.md](./secret-rotation.md)).
- **Push protection:** Prefer enabling **push protection** for the org/repo so blocked secrets never land on the default branch.

### Complement: CI secret scan (Gitleaks)

Workflow [`.github/workflows/gitleaks.yml`](../../.github/workflows/gitleaks.yml) runs [Gitleaks](https://github.com/gitleaks/gitleaks) on PRs and mainline pushes. Treat failures like secret scanning alerts.

## Dependabot alerts

- **What it does:** Flags **known vulnerabilities** in dependencies (from GitHub’s advisory database).
- **Where alerts appear:** **Security → Dependabot alerts** (and the Dependency graph).
- **Who reviews:** Engineering lead or module owner; patch **critical/high** promptly per SLA you define.
- **What to do:** Apply the suggested upgrade or bump the affected package; re-run CI and Snyk (see [snyk.md](./snyk.md)).

## Dependabot version updates

- **What it does:** Opens **version bump PRs** on a schedule (not only security).
- **Where configured:** [`.github/dependabot.yml`](../../.github/dependabot.yml) at the repository root.
- **Who reviews:** Any engineer may merge after CI passes; batch or group noisy updates as configured.

## Pull request / branch protection

Release-blocking conditions for application changes are summarized in [ci-policy.md](../ci-policy.md) and [pr-security-gates.md](./pr-security-gates.md). **Branch protection rules** (required status checks, reviews) are set in **Settings → Branches** — align required checks with CI + security workflows you want to block merges.

## Alert routing

See [alert-routing.md](./alert-routing.md) for email, Slack, and dashboard visibility.
