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
- **Illustrator assignment guide:** [EXERCISE_4_SHAPE_BUILDER_TEACHER_REQUIREMENTS.md](EXERCISE_4_SHAPE_BUILDER_TEACHER_REQUIREMENTS.md) — exact shape-first workflow for Exercise 4 (Shape Builder proof + submission checklist).

---

## Production operations

- **Backups:** [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md) · **Restore:** [RESTORE_PROCEDURE.md](RESTORE_PROCEDURE.md)
- **Deploy / rollback:** [DEPLOYMENT.md](DEPLOYMENT.md) · **Checklist:** [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Env & security:** [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Monitoring & alerts:** [MONITORING_METRICS.md](MONITORING_METRICS.md) · [ALERTING_RULES.md](ALERTING_RULES.md)
- **Incidents:** [INCIDENT_PLAYBOOKS.md](INCIDENT_PLAYBOOKS.md) · **Post-launch:** [POST_LAUNCH_MONITORING.md](POST_LAUNCH_MONITORING.md)

---

## Start here

- **Investors & partners:** [Investor pitch system](investor-pitch.md) + [final-investor-pitch.md](final-investor-pitch.md) (final spoken pitch) + [live-pitch-script.md](live-pitch-script.md) + [pitch-delivery.md](pitch-delivery.md) + [pitch-deck-slides.md](pitch-deck-slides.md) (import-ready bullets) + [pitch-deck.md](pitch-deck.md) (layouts) + [design-system.md](design-system.md) (BNHub black + gold) · [presentations/](presentations/README.md) (**BNHub_Pitch_Deck_Premium.pptx**) + [financials.md](financials.md) (labeled estimates) + [investor-outreach.md](investor-outreach.md) · [Investor Pitch Deck](INVESTOR-PITCH-DECK.md) (10-slide LECIPM deck) | [Platform Architecture Deck](PLATFORM-ARCHITECTURE-DECK.md) (18 slides) — vision, problem, solution, product, market, business model, technology, growth, roadmap.
- **New to the project:** [Developer Onboarding](DEVELOPER-ONBOARDING.md) — purpose, repo structure, how to run, how to add modules, coding standards, testing.
- **Team, hiring & execution:** [team-structure.md](team-structure.md) (roles & hierarchy) · [roles.md](roles.md) · [daily-execution.md](daily-execution.md) · [tasks.md](tasks.md) · [hiring.md](hiring.md) · [onboarding-team.md](onboarding-team.md) · [performance.md](performance.md) (business metrics) · [communication.md](communication.md) · [growth-execution.md](growth-execution.md) · [sales-execution.md](sales-execution.md) — plus [team-workflow.md](team-workflow.md) / [onboarding.md](onboarding.md) for Git and dev setup.
- **Architecture & build:** [Master Index](architecture/master-index.md) — links to all major docs and recommended reading order.
- **Module boundaries:** [Platform Modules Registry](architecture/MODULES-REGISTRY.md) — every major module with purpose, location, APIs, dependencies.
- **High-level picture:** [Architecture Diagram](architecture/ARCHITECTURE-DIAGRAM.md) — users → applications → services → APIs → data / AI / defense → infrastructure.
- **Ready to build?** [Build Readiness Checklist](BUILD-READINESS-CHECKLIST.md) — confirm repo, docs, schema, API, frontend, and implementation plan are in place.
- **First 10 real users (scripts + CRM)?** [first-10-users.md](first-10-users.md) + [first-10-tracking.md](first-10-tracking.md) — outreach scripts, daily targets, optional `/admin/early-users` after migration.
- **First 100 users (channels + content + CRM)?** [first-100-users.md](first-100-users.md) + [content-plan.md](content-plan.md) + [growth-review.md](growth-review.md) — `/early-access` lead capture, filters, templates.
- **First 1000 users (automation + ads + funnel)?** [first-1000-users.md](first-1000-users.md) + [content-30days.md](content-30days.md) + [ads-strategy.md](ads-strategy.md) + [funnel-metrics.md](funnel-metrics.md) + [growth-optimization.md](growth-optimization.md) — `/admin/growth-crm`, outreach + content services under `apps/web/services/growth/`.
- **10K scale (liquidity + retention + revenue)?** [10k-scaling-system.md](10k-scaling-system.md) + [ads-scaling.md](ads-scaling.md) + [content-machine.md](content-machine.md) + [weekly-growth-review.md](weekly-growth-review.md) — `/admin/growth-dashboard`, `ai-autopilot.ts`, `retention.ts`, marketplace balance helpers.
- **100K domination (Montreal → Canada, network effects)?** [100k-domination-system.md](100k-domination-system.md) + [marketing-machine.md](marketing-machine.md) + [domination-review.md](domination-review.md) — city LPs `/montreal`, `/laval`, `/quebec-city`, `/toronto`, `/vancouver`, `ai-autopilot-advanced.ts`, `network-effects.ts`, dashboard domination panel.
- **Enterprise (multi-region, trust, ops, analytics)?** [enterprise-scaling-system.md](enterprise-scaling-system.md) + [trust-compliance.md](trust-compliance.md) + [partnerships.md](partnerships.md) + [brand-strategy.md](brand-strategy.md) + [operations.md](operations.md) + [risk-management.md](risk-management.md) + [city-launch-playbook.md](city-launch-playbook.md) — `/admin/enterprise-dashboard`, `apps/web/services/automation/*`.
- **Enterprise B2B sales (partners, pipeline)?** [enterprise-sales.md](enterprise-sales.md) + [sales-scripts.md](sales-scripts.md) + [partner-onboarding.md](partner-onboarding.md) + [sales-review.md](sales-review.md) — `/admin/sales-dashboard`, table `enterprise_leads`.
- **7-day blitz (real users + listings + growth)?** [7-Day Execution Plan](7day-execution-plan.md) + [7-Day Metrics](7day-metrics.md) — daily tasks, team split, tracking sheet.
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

Opens the web app at [http://localhost:3001](http://localhost:3001).

**Database:** Set `DATABASE_URL` in `apps/web/.env`, then:

```bash
cd apps/web
npx prisma db push
npx prisma db seed
```

See the root [README](../README.md) and [Development Setup](engineering/DEVELOPMENT-SETUP.md) for more.
