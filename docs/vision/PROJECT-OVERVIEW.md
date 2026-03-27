# LECIPM Platform — Project Overview

Single reference for the core idea, main modules, philosophy, and current stage of the platform.

---

## Core idea

A **trusted digital ecosystem** connecting:

- **People** (searchers, guests, renters)
- **Licensed professionals** (brokers, agents)
- **Property owners** (hosts, sellers)
- **Investors**

around **real estate, rentals, and property-related services**.

The platform focuses on:

| Focus | Description |
|-------|-------------|
| **Trust** | Verification and transparency as foundation. |
| **Verification** | Identity, professional credentials, property (e.g. cadastre/registry). |
| **Long-term relationships** | Not only one-off transactions. |
| **Professional real-estate participation** | Brokers and regulated actors integrated. |
| **AI-assisted tools** | Pricing, analytics, fraud detection, moderation. |

---

## Important: ecosystem, not just marketplace

The platform is **not only a marketplace**. It is a **property ecosystem platform**, similar in scope to how large operators connect multiple services (e.g. Airbnb, Zillow, Redfin).

It combines:

- Property marketplace (sale, long-term rental)
- Short-term rentals (BNHub)
- Broker ecosystem (CRM, leads, portfolios)
- Investor network (deals, analytics)
- AI platform tools (pricing, fraud, moderation)

into **one integrated environment**.

---

## Main modules (planned architecture)

### 1. Real Estate Marketplace

- Listings for **sale**, **long-term rental**, and **investment opportunities**.
- Verification (e.g. cadastre/property registry checks) to reduce fraud.

### 2. Broker CRM

- Tools for licensed brokers to:
  - Manage clients and leads
  - Manage listings
  - Communicate with buyers and sellers

### 3. BNHub — Short-Term Rental Network

- Short-term rental system integrated with the rest of the ecosystem.
- **Features:** Host dashboards, guest bookings, pricing tools, AI assistance, property verification.
- **Detail:** [BNHub business model](BNHUB-BUSINESS-MODEL.md)

### 4. AI Operating System (AI-OS)

- Centralized intelligence layer for the whole platform:
  - Fraud detection, trust & risk scoring, dynamic pricing, demand forecasting
  - Content moderation, support triage, compliance monitoring
  - Recommendations, broker/owner insights, human-in-the-loop governance  
- **Blueprint:** [LECIPM-AI-OPERATING-SYSTEM.md](LECIPM-AI-OPERATING-SYSTEM.md)

### 5. Owner Dashboard

- Property owners can:
  - Manage listings
  - Track bookings
  - Monitor revenue
  - Communicate with brokers or guests

### 6. Deal Marketplace

- Where investors and professionals discover:
  - Property deals
  - Partnership opportunities
  - Off-market properties

### 7. Investment Analytics

- Tools showing:
  - Rental yield
  - ROI estimates
  - Market insights

### 8. Trust & Safety System

- **Identity verification**
- **Property ownership verification**
- **Fraud detection**
- **Moderation tools**  
*(Aligned with [Platform mission — trust framework](PLATFORM-MISSION.md#trust-and-verification-framework) and [Governance](PLATFORM-GOVERNANCE.md).)*

### 9. Multi-Platform Apps

- **Web**, **iOS**, **Android** with shared infrastructure.

---

## Philosophy

- **Relationship-driven ecosystem**
- **Verified professionals**
- **Trusted environment**
- **Community and collaboration**

Reflected in:

- [docs/PLATFORM-MISSION.md](PLATFORM-MISSION.md)
- Public **About platform** page (route: `/about-platform`)
- Homepage introduction
- Admin dashboard mission section

---

## Current stage

**Reached:** Platform foundation and module design.

Work already done includes:

- Architecture and philosophy
- Trust framework and governance
- BNHub rental system (business model, rollout strategy)
- Fraud protection logic and cadastre/verification concepts

**Moving into:** BNHub business model refinement and global rollout strategy (and implementation of modules).

---

## Folder structure (leciplatform)

```
leciplatform/
├─ apps/
│   ├─ web-app           # Public marketplace + BNHub
│   ├─ admin-dashboard   # Platform admin & Trust & Safety
│   ├─ broker-dashboard  # Broker CRM
│   ├─ owner-dashboard   # Owner portfolio & revenue
│   └─ mobile-app        # iOS/Android
├─ services/
│   ├─ auth-service
│   ├─ user-service
│   ├─ listing-service
│   ├─ search-service
│   ├─ booking-service
│   ├─ payment-service
│   ├─ messaging-service
│   ├─ review-service
│   ├─ trust-safety      # (trust-safety-service in docs)
│   └─ analytics-service
├─ packages/
│   ├─ ui-components
│   ├─ api-client
│   ├─ design-tokens
│   └─ shared-utils
├─ infrastructure/
│   ├─ database
│   ├─ docker
│   └─ deployment
└─ docs/
    ├─ system-map        # Index: system map docs
    ├─ architecture      # Index: architecture & build order
    ├─ api               # Index: API blueprint
    └─ product           # Index: PRD, roadmap, Montreal, expansion
```

*(Existing packages `ui`, `auth`, `api`, `database` and services `broker-crm`, `ai-control-center`, `bn-hub` remain; new folders align with the platform map and Build Order.)*

---

## Document index

| Document | Purpose |
|----------|---------|
| [PLATFORM-MISSION.md](PLATFORM-MISSION.md) | Mission, vision, values, roles, trust framework |
| [PLATFORM-GOVERNANCE.md](PLATFORM-GOVERNANCE.md) | Rules, verification, fraud, conduct, disputes, enforcement |
| [PLATFORM_ROLES.md](PLATFORM_ROLES.md) | Ecosystem roles in code (Prisma) |
| [BNHUB-BUSINESS-MODEL.md](BNHUB-BUSINESS-MODEL.md) | BNHub positioning, participants, revenue, AI, trust, rollout |
| [LECIPM-PLATFORM-ARCHITECTURE.md](LECIPM-PLATFORM-ARCHITECTURE.md) | Full technical platform architecture (services, data, API, security, scaling) |
| [LECIPM-SUPER-PLATFORM-MAP.md](LECIPM-SUPER-PLATFORM-MAP.md) | Platform map: layers, users, apps, marketplaces, services, AI, data, infrastructure |
| [LECIPM-AI-OPERATING-SYSTEM.md](LECIPM-AI-OPERATING-SYSTEM.md) | AI-OS blueprint: mission, architecture, engines, fraud, trust, pricing, moderation, support, compliance, rollout |
| [LECIPM-MONETIZATION-ARCHITECTURE.md](LECIPM-MONETIZATION-ARCHITECTURE.md) | Monetization blueprint: philosophy, revenue streams, subscriptions, BNHub, advertising, financial services, analytics, services, travel, global pricing, allocation, vision |
| [LECIPM-LEGAL-SHIELD-FRAMEWORK.md](LECIPM-LEGAL-SHIELD-FRAMEWORK.md) | Legal Shield: platform role, terms, listing responsibility, payments, disputes, Trust & Safety, anti-fraud, liability, compliance, privacy, governance, global adaptation |
| [LECIPM-GOVERNANCE-CONSTITUTION.md](LECIPM-GOVERNANCE-CONSTITUTION.md) | Governance Constitution: structure, rules, policy process, enforcement, Trust & Safety, AI oversight, risk, incidents, financial and compliance oversight, transparency, metrics, ethics, vision |
| [LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md](LECIPM-GLOBAL-EXPANSION-BLUEPRINT.md) | Global expansion: vision, market selection, pilot strategy, regional expansion, BNHub/marketplace expansion, regulatory compliance, localization, partnerships, marketing, infrastructure, Trust & Safety, metrics, risk, phased roadmap |
| [LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md](LECIPM-MONTREAL-LAUNCH-PLAYBOOK.md) | Montreal launch playbook: objectives, readiness, supply acquisition, broker/host onboarding, listing quality, payment and Trust & Safety testing, marketing, support, launch day, 90-day monitoring, metrics, expansion readiness |
| [LECIPM-MASTER-PRODUCT-ROADMAP.md](LECIPM-MASTER-PRODUCT-ROADMAP.md) | Year 1 product roadmap: 6 development phases (core, Trust & Safety, BNHub, broker/owner tools, AI, optimization), mobile, testing, Montreal prep, milestones, metrics, team, risks, long-term vision |
| [LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md](LECIPM-SUPER-PLATFORM-MASTER-BLUEPRINT.md) | **Master blueprint:** Unifies ecosystem, architecture, services, AI-OS, data, Trust & Safety, Legal Shield, Governance, monetization, expansion, Montreal pilot, product roadmap, infrastructure, security, localization, metrics, long-term vision |
| [LECIPM-INVESTOR-PITCH-ARCHITECTURE.md](LECIPM-INVESTOR-PITCH-ARCHITECTURE.md) | Investor pitch deck outline: 20 slides (problem, opportunity, solution, product, architecture, AI, Trust & Safety, business model, Montreal pilot, expansion, competition, roadmap, traction, GTM, financials, team, funding, vision, closing) with talking points and suggested visuals |
| [LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md) | Full PRD: product overview, target users, user journeys, marketplace/BNHub/CRM/owner/deal/analytics/Trust & Safety/AI features, payments, messaging, admin, mobile, security, performance, metrics, future features |
| [LECIPM-ENGINEERING-TASK-MAP.md](LECIPM-ENGINEERING-TASK-MAP.md) | Engineering task map: 19 task areas (foundation, listing, search, BNHub, payment, messaging, review, Trust & Safety, broker CRM, owner dashboard, deal marketplace, analytics, AI, admin, mobile, security, infra, testing, deployment) with concrete tasks and 4-wave prioritization |
| [LECIPM-DEVELOPMENT-SPRINT-PLAN.md](LECIPM-DEVELOPMENT-SPRINT-PLAN.md) | 16-sprint development plan (16 weeks): sprint goals, task IDs per sprint, deliverables, success criteria, metrics, retrospective process, post-pilot continuation |
| [LECIPM-DATABASE-SCHEMA-BLUEPRINT.md](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) | Database schema blueprint: design philosophy, core user/property/booking/payment/messaging/review/broker/owner/deal/analytics/Trust & Safety/AI/admin/notification/system tables, relationships, indexing, security, scalability |
| [LECIPM-API-ARCHITECTURE-BLUEPRINT.md](LECIPM-API-ARCHITECTURE-BLUEPRINT.md) | API architecture blueprint: domains, endpoint groups, auth/user/verification/listing/search/BNHub/booking/calendar/payment/payout/messaging/review/CRM/owner/deal/analytics/Trust & Safety/dispute/AI/notifications/admin/media/reports, authorization matrix, errors, security, versioning, integration, events, summary |
| [LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md) | Frontend architecture blueprint: apps, pages/screens, dashboards, navigation, components, design system, responsive, state, data fetching, forms, search, booking UX, security, a11y, performance, folder structure, role mapping, priorities, testing |
| [LECIPM-DESIGN-SYSTEM-BLUEPRINT.md](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md) | UI/UX design system blueprint: vision, brand principles, visual identity, color/typography/spacing/grid/iconography/elevation, motion, UX and trust rules, navigation, page templates, cards/buttons/forms/search/listing/booking/dashboard/tables/status/messaging/empty states, modals/drawers, mobile, a11y, responsive, Trust & Safety language, analytics/charts, microcopy, tokens, documentation, cross-platform, role-based styling, QA and governance |
| [LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md](LECIPM-DESIGN-TO-CODE-IMPLEMENTATION-GUIDE.md) | Design-to-code implementation guide: implementation philosophy, frontend stack, design tokens in code, core UI library, layout/marketplace/booking/dashboard/messaging/trust components, form/state/API patterns, responsive/performance/a11y, testing, folder structure, documentation, workflow, maintainability |
| [LECIPM-SYSTEM-MAP.md](LECIPM-SYSTEM-MAP.md) | **System Map:** Master platform map and operating model—users, applications, modules, services, APIs, data, AI, Trust & Safety, governance, monetization, infrastructure, security, role access, phase-based build, Montreal launch, global expansion, visual narrative, executive summary |
| [LECIPM-BUILD-ORDER.md](LECIPM-BUILD-ORDER.md) | **Build Order:** Strict implementation sequence—19 phases from infrastructure → core user → listing → search → booking → payment → messaging/reviews → Trust & Safety → host/broker/owner tools → deals → analytics → AI → admin → mobile → testing → Montreal pilot → global scaling |
| [LECIPM-CURSOR-EXECUTION-MODE-GUIDE.md](LECIPM-CURSOR-EXECUTION-MODE-GUIDE.md) | **Cursor Execution Mode:** How to use Cursor to build LECIPM step-by-step—dev philosophy, repo init, backend/frontend/DB/API order, component library, feature slices, testing, debugging, CI/CD, security, performance, docs, launch prep, post-launch |
| **PROJECT-OVERVIEW.md** (this file) | Core idea, modules, philosophy, stage |
