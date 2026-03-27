# Enterprise scaling system — BNHub + LECIPM

Build **sustainable** platform depth: multi-region expansion, defensible trust, partnerships, automation with **human oversight**, and analytics for decisions. This is **not** a promise of market dominance or guaranteed outcomes — it is an execution framework.

**Admin:** `/admin/enterprise-dashboard` (regional rollups + funnel + retention proxies). **Prior tiers:** [100k-domination-system.md](100k-domination-system.md), [10k-scaling-system.md](10k-scaling-system.md).

---

## Expansion strategy

- **Depth before breadth** — liquidity and operations quality in each region before the next.  
- **Canada first** — align product, payments, tax, and privacy with Canadian expectations; international follows with localized checklists.  
- **Measurable gates** — supply, bookings, dispute rate, NPS/support load — not vanity MAU alone.

See phases and checklists in [city-launch-playbook.md](city-launch-playbook.md).

---

## Platform architecture

**Monorepo (this repository):**

- **`apps/web`** — Next.js: BNHub, LECIPM surfaces, admin (`/admin/*`), APIs under `app/api/*`.  
- **`apps/*`** — Additional frontends as needed.  
- **`packages/*`** — Shared UI, config, types, auth helpers (some packages reference Supabase clients where used).  
- **`services/*`** — Focused backends (auth, listing, booking, etc.) — clear **bounded contexts** and contracts.

**Data & ORM:** Primary BNHub/LECIPM persistence is **PostgreSQL** via **Prisma** (`apps/web/prisma/schema.prisma`). If Supabase or other clients are used (e.g. auth or specific modules), treat them as **integration points** with explicit env vars and no silent failover.

**API boundaries:** Route handlers and service modules should keep **domain logic** out of React components; prefer stable JSON contracts for admin dashboards and future mobile clients.

**Environments:** **dev / staging / prod** with separate databases and secrets; no production data in dev. Document URLs and promotion process in your internal runbooks (see [DEPLOYMENT.md](DEPLOYMENT.md) if present).

---

## Trust & compliance

Canonical detail: **[trust-compliance.md](trust-compliance.md)** — identity, listings, fraud, disputes, **PIPEDA-aligned** practices (principles-level; legal counsel for jurisdictional text).

---

## Partnerships

**[partnerships.md](partnerships.md)** — property managers, travel adjacencies, marketing, enterprise; onboarding and integration expectations.

**B2B sales CRM:** [enterprise-sales.md](enterprise-sales.md) · **`/admin/sales-dashboard`** (`enterprise_leads`).

---

## Automation

Controlled, **auditable** automation lives in:

- `apps/web/services/automation/marketing.ts` — assisted briefs (from growth autopilot modules).  
- `apps/web/services/automation/onboarding.ts` — host/guest guidance and pricing assistance.  
- `apps/web/services/automation/retention.ts` — re-engagement copy, loyalty summaries, trigger **rules** (implement with flags + logs).

**Principle:** no silent mass outbound without review; log actor and template version when you wire jobs.

---

## Analytics

- **Enterprise dashboard** — users (global), listings/bookings/**GMV by `listing.country`**, repeat-booking proxy, LECIPM funnel.  
- **Growth dashboard** — city domination and balance ([10k/100k](100k-domination-system.md)).  
- **Data quality:** ensure listing `country` and currency match go-live market; otherwise regional charts skew.

---

## Revenue scaling

- **Booking commissions** — core; transparent fee breakdown on checkout.  
- **Premium host plans** — tools that save time (calendar, analytics, support).  
- **Featured listings** — supply-constrained markets only if ROI-positive.  
- **Optional ads** — protect UX; cap density and label clearly.

Track **revenue by region** using listing country attribution (same as dashboard) until finance adopts a ledger dimension.

---

## Mobile + cross-platform

- **Web-first parity** — responsive BNHub flows; session security (httpOnly cookies, HTTPS).  
- **Native apps** — push notifications and offline-light flows when shipped; same API contracts as web.

---

## Operations & reliability

- **[operations.md](operations.md)** — support, moderation, escalation, SLAs.  
- **Performance:** caching, image/CDN, DB indexes on hot paths — see [MONITORING_METRICS.md](MONITORING_METRICS.md) / [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md) where applicable.  
- **[risk-management.md](risk-management.md)** — technical, legal, operational, abuse.

---

## Brand & positioning

**[brand-strategy.md](brand-strategy.md)** — trust, transparency, host and guest value; no exaggerated claims.

---

## Multi-region expansion (summary)

| Phase | Scope | Focus |
|-------|--------|--------|
| 1 | Montreal | Density, ops runbooks, trust metrics |
| 2 | Québec + Ontario | Localization, supply partnerships |
| 3 | Canada-wide | Compliance variance by province |
| 4 | International cities | Currency, language, **local legal review** |

**Localization:** currency display, payment methods, tax lines, copy (FR/EN minimum in Canada), listing rules per jurisdiction.

---

## Validation

- [ ] Enterprise dashboard loads with expected regions  
- [ ] Trust & compliance doc acknowledged by legal/ops  
- [ ] Automation jobs (when added) have audit logs  
- [ ] Backups and incident runbooks tested annually  
- [ ] City launch playbook used before each new metro  
