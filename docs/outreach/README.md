# LECIPM Manager — Investor outreach system

Structured outreach for **LECIPM Manager** (AI-managed real estate & stays marketplace): targeting, templates, follow-up rhythm, CRM rules, and optional tooling in the web app.

## File index

| File | Purpose |
|------|---------|
| [investor-targeting.md](investor-targeting.md) | Who to reach, categories, channels, prioritization |
| [investor-database-template.csv](investor-database-template.csv) | CSV column template for your pipeline |
| [outreach-templates.md](outreach-templates.md) | Cold / warm email, LinkedIn DM, follow-up copy |
| [follow-up-sequences.md](follow-up-sequences.md) | Day 0 / 3 / 7 / 14 sequence |
| [outreach-playbook.md](outreach-playbook.md) | Daily & weekly workflow, goals, best practices |
| [crm-logic.md](crm-logic.md) | Pipeline states and automation rules |

## Consistency rules

- **Name:** Use **LECIPM Manager** everywhere in external copy.
- **Traction:** Do not claim revenue, user counts, or growth unless verified. Safe stage line: *platform built; soft launch ready*.
- **Tone:** Professional, concise, meeting-oriented CTAs.
- **Numbers in playbook:** Reply rates and meeting targets are **internal goals**, not reported metrics.

## Optional web CRM

- **UI:** `/investors-crm` (platform admins only) — table, filters, status actions.
- **API:** `GET` / `POST` `/api/investors`, `PATCH` `/api/investors/[id]` — persists to `apps/web/data/investors-crm.json` (local/dev). Serverless read-only filesystem may block writes in production; migrate to your database or use the platform admin fundraising area in `apps/web` if needed.

## Related

- Full investor narrative & materials: [docs/investors/](../investors/README.md)
