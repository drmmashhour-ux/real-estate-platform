# LECIPM Platform — Documentation

This folder is the **LECIPM Project Architecture Workspace**: the canonical location for platform documentation, organized so engineers and AI coding tools can navigate and implement efficiently.

**Central reference:** [Master Strategy Book](MASTER-STRATEGY-BOOK.md) — Single strategic manual in 16 chapters (vision, problem, solution, architecture, modules, trust, defense, AI, business model, growth, roadmap, launch, scaling, operations, founder strategy, long-term vision). For founders, executives, engineers, investors, and operations. **One-page overview:** [War Map](WAR-MAP.md) — How every major part of the company fits together: mission, ecosystem map, engines, infrastructure, T&S, defense, AI, revenue, growth, expansion, command, timeline, competitive position, long-term position. **Governance:** [Control Blueprint](CONTROL-BLUEPRINT.md) — How the platform is controlled, decision authority, founder and executive roles, policy and T&S oversight, crisis and evolution governance.

---

## Documentation structure

| Folder | Contents |
|--------|----------|
| **[vision/](vision/)** | Mission, project overview, platform roles, strategic design |
| **[architecture/](architecture/)** | System map, platform architecture, DB/API/frontend blueprints, design system, design-to-code guide, master index, modules registry, diagram |
| **[product/](product/)** | Product requirements, roadmap, business model, monetization |
| **[engineering/](engineering/)** | Development setup, build order, task map, sprint plan, Cursor execution guide, test reports |
| **[operations/](operations/)** | Marketplace power features, revenue & growth, governance, anti-failure safeguards, BNHub architecture |
| **[ai/](ai/)** | AI Operating System (concise and full) |
| **[defense/](defense/)** | Platform Defense Layer, legal shield framework |
| **[launch/](launch/)** | Montreal launch playbook, global expansion blueprint |
| **[api/](api/)** | API overview and standards |

---

## Brand & design system

- **Brand guidelines:** [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) — logo, colors, typography, spacing, UI kit usage (`apps/web/config/*`, `components/ui/*`).

---

## Production operations

- **Backups:** [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md) · **Restore:** [RESTORE_PROCEDURE.md](RESTORE_PROCEDURE.md)
- **Deploy / rollback:** [DEPLOYMENT.md](DEPLOYMENT.md) · **Checklist:** [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Env & security:** [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Monitoring & alerts:** [MONITORING_METRICS.md](MONITORING_METRICS.md) · [ALERTING_RULES.md](ALERTING_RULES.md)
- **Incidents:** [INCIDENT_PLAYBOOKS.md](INCIDENT_PLAYBOOKS.md) · **Post-launch:** [POST_LAUNCH_MONITORING.md](POST_LAUNCH_MONITORING.md)

---

## Start here

- **Investors & partners:** [Investor Pitch Deck](INVESTOR-PITCH-DECK.md) (10 slides) | [Platform Architecture Deck](PLATFORM-ARCHITECTURE-DECK.md) (18 slides) — vision, problem, solution, product, market, business model, technology, growth, roadmap.
- **New to the project:** [Developer Onboarding](DEVELOPER-ONBOARDING.md) — purpose, repo structure, how to run, how to add modules, coding standards, testing.
- **Architecture & build:** [Master Index](architecture/master-index.md) — links to all major docs and recommended reading order.
- **Module boundaries:** [Platform Modules Registry](architecture/MODULES-REGISTRY.md) — every major module with purpose, location, APIs, dependencies.
- **High-level picture:** [Architecture Diagram](architecture/ARCHITECTURE-DIAGRAM.md) — users → applications → services → APIs → data / AI / defense → infrastructure.
- **Ready to build?** [Build Readiness Checklist](BUILD-READINESS-CHECKLIST.md) — confirm repo, docs, schema, API, frontend, and implementation plan are in place.
- **Launching the first market?** [90-Day Execution Plan](90-DAY-EXECUTION-PLAN.md) — week-by-week plan for product, engineering, operations, trust & safety, and pilot launch (e.g. Montreal).
- **Scaling after pilot?** [24-Month Scaling Roadmap](24-MONTH-SCALING-ROADMAP.md) — phased roadmap: stabilization, supply expansion, monetization, multi-city, AI optimization, global evolution.
- **Leadership visibility?** [Founder Control Dashboard](FOUNDER-CONTROL-DASHBOARD.md) (~20 daily metrics) | [Founder Command Center](FOUNDER-COMMAND-CENTER.md) (five full dashboards): marketplace health, revenue, supply & growth, trust & safety, product & UX. **Daily discipline:** [Daily Founder Routine](DAILY-FOUNDER-ROUTINE.md) — morning check, T&S review, growth and product signals, ops coordination, strategic work, end-of-day review, weekly/monthly connection.
- **Running the platform day-to-day?** [Platform Operating Manual](PLATFORM-OPERATING-MANUAL.md) — operations guide for founders, ops, T&S, support, growth, compliance: mission, modules, marketplace, T&S, support, growth, finance, AI, monitoring, crisis, compliance, expansion, reviews, evolution, principles.
- **Leading the company long-term?** [Founder Playbook](FOUNDER-PLAYBOOK.md) — strategic guide: vision, principles, 5-year strategy, product, hiring, partnerships, fundraising, competition, governance, risk, decision framework, culture, long-term vision.

---

## Repository layout (monorepo)

```
/
├── apps/           # web-app (main), admin-dashboard, broker-dashboard, owner-dashboard, mobile-app
├── packages/       # ui-components, api-client, design-tokens, shared-utils, ui, auth, api, database
├── services/       # auth, user, listing, search, booking, payment, messaging, review, trust-safety, etc.
├── infrastructure/ # docker, database, deployment
└── docs/           # This workspace
```

---

## Run the project locally

From **repository root**:

```bash
npm install
npm run dev
```

Opens the web app at [http://localhost:3000](http://localhost:3000).

**Database:** Set `DATABASE_URL` in `apps/web/.env`, then:

```bash
cd apps/web
npx prisma db push
npx prisma db seed
```

See the root [README](../README.md) and [Development Setup](engineering/DEVELOPMENT-SETUP.md) for more.
