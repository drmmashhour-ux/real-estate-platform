# Security alert routing

Where notifications go and who acts on them.

## GitHub (code scanning, Dependabot, secret scanning)

| Channel | Setup |
|---------|--------|
| **Email** | **Settings → Notifications** (personal) and **Watch → Custom → Security alerts** on the repo. Org admins can enforce team routing. |
| **Slack** | Install [GitHub + Slack](https://github.com/integrations/slack) (org or workspace). Subscribe the security channel to `security_alerts` for the org/repo. |
| **In-app** | **Security** tab lists open alerts; assign owners in the GitHub UI where available. |

**Default owner:** engineering on-call or the primary maintainer of `apps/web`.

## Snyk

| Channel | Setup |
|---------|--------|
| **Email / Slack** | Configure in **Snyk → Organization / Integration settings** (Slack app, email digest). |
| **PR checks** | Snyk test runs on PRs when `SNYK_TOKEN` is present; failures block merge if branch protection requires the workflow. |

## Vercel (runtime, anomalies)

| Channel | Setup |
|---------|--------|
| **Email** | Vercel **Team → Settings → Notifications** — deployment failures, usage, billing. |
| **Slack** | Vercel Slack integration from team settings (deployment and incident notifications). |
| **Dashboard** | **Vercel → Project → Logs / Observability** for live investigation (see [vercel-alerting.md](./vercel-alerting.md)). |

## Application (future / MVP)

- **Admin security page:** [`/admin/security`](../../apps/web/app/[locale]/[country]/admin/security/page.tsx) aggregates recent `platform_events` and system alerts — not a full SIEM.
- **Durable routing:** Forward Vercel logs to Datadog / Axiom / S3 via log drains for paging on spikes (documented in [vercel-logs.md](../dev/vercel-logs.md) if present).

## Escalation

For suspected breach or active abuse, follow [incident-playbook.md](./incident-playbook.md) and [incident-response.md](./incident-response.md).
