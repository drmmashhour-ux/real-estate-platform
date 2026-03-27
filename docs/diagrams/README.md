# Architecture diagrams

Mermaid source files (`.mmd`) for the real estate platform. Use them for onboarding, engineering reviews, and investor or technical decks.

## What each file shows

| File | Audience | Purpose |
|------|----------|---------|
| `system-overview.mmd` | Everyone | Layers: users → frontend → API → services → shared core → data → outputs. |
| `request-flow.mmd` | Developers | Typical request path from UI through auth, tenancy, validation, service, DB, events, response; dashed = optional branches (action queue, analytics, logging). |
| `tenant-isolation.mmd` | Developers, security | How tenant context flows server-side; rules for scoping; global admin override path. |
| `workflow-lifecycle.mmd` | Product, sales, engineering | End-to-end deal journey and how intake, notifications, action queue, and audit relate. |
| `finance-flow.mmd` | Finance, engineering | From deal context to commissions, invoices, payments, dashboards; payment provider as optional boundary. |
| `integrations-boundary.mmd` | Architects, investors | Core platform vs swappable integrations; emphasizes modularity without claiming every adapter is live. |

## How to render Mermaid

- **GitHub / GitLab:** Paste diagram body into a fenced block in Markdown (` ```mermaid `) or use native `.mmd` preview if your tool supports it.
- **VS Code / Cursor:** Extensions such as “Markdown Preview Mermaid Support” or “Mermaid” preview `.mmd` files.
- **CLI:** [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) (`mmdc -i file.mmd -o out.svg`).
- **Web:** [Mermaid Live Editor](https://mermaid.live) — paste contents, export PNG/SVG.

### Export to PNG or SVG (slides / PDFs)

1. Open `*.mmd` in [mermaid.live](https://mermaid.live) or run `npx @mermaid-js/mermaid-cli@latest -i docs/diagrams/system-overview.mmd -o system-overview.svg` from the repo root (requires Node; add the CLI as a dev dependency if you use this often).
2. Import the SVG/PNG into Google Slides, Keynote, or Notion.

## Keeping diagrams up to date

- When you add a major layer (new service domain, new integration, or change tenant rules), update the relevant `.mmd` in the same PR as the code or ADR.
- Prefer small edits to one diagram over stuffing everything into `system-overview.mmd`.
- **Rule:** Diagrams should reflect **current or committed architecture** and clearly labeled **future/optional** pieces—not fiction. If something is planned only, label it in the diagram (dashed lines, “future”, subgraph titles) or keep it in a design doc until it lands.

## File format

Files use the `.mmd` extension for clarity; content is standard Mermaid syntax (often `flowchart` / `flowchart TD|LR`). Rename to `.md` with a `mermaid` code fence if your toolchain only recognizes Markdown.
