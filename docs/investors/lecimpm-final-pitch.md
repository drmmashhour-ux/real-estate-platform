# LECIPM

**AI-Powered Real Estate Operating System**

Confidential · For discussion with qualified investors · Update cadence: monthly

---

## 1. Title

**LECIPM — AI-Powered Real Estate Operating System**

*Not a passive listing site: a transaction and intelligence layer for brokers, sellers, buyers, and (where enabled) investors — with Québec-appropriate privacy and brokerage compliance in scope.*

---

## 2. Problem

- **Real estate platforms are often passive directories** — traffic arrives, then friction and leakage happen off-platform.
- **Brokers lose leads** to slow follow-up, unclear routing, and weak prioritization.
- **There is rarely a unified intelligence layer** across listings, deals, CRM leads, and marketplace health.
- **Deals are under-optimized** — milestones, pricing posture, and funnel hygiene are inconsistent without structured signals.

---

## 3. Solution

**LECIPM:**

- **Captures and attributes leads** (including differentiated treatment for syndicated / partner sources where configured).
- **Analyzes deals** with a deal intelligence lens (scores, probabilities, advisory events — not legal status).
- **Guides brokers** with an AI **assistant that suggests only** (no autonomous client messaging).
- **Learns from outcomes** via stored deal outcomes and pattern summaries (descriptive analytics, not guaranteed causality).
- **Optimizes the marketplace** through flywheel metrics, ranking, and **review-first** optimization suggestions (no destructive auto-actions).

---

## 4. Product

Core modules (as implemented or in active rollout):

| Module | Role |
|--------|------|
| **Lead funnel engine** | `Lead` + rich attribution (`source`, UTM, `distributionChannel`, etc.); behavioral and CRM events across the stack |
| **Deal intelligence engine** | Deal tracking; `dealScore`, `closeProbability`, pipeline lens — **advisory** |
| **AI broker assistant** | Follow-ups, reminders, alerts — **suggestions only** |
| **Compliance + insurance layer** | Co-ownership / insurance checklist signals; compliance snapshots; audit-friendly logs where modeled |
| **Investment engine** | Ranking / ROI **bands** for eligible listings — **not personalized investment advice** |
| **Learning system** | `DealOutcome` → `LearningPattern` → bounded score nudges |
| **Marketplace optimizer** | Threshold-based **suggestions** (boost, pricing review, broker enablement) — **requires human review** |

---

## 5. Differentiation

- **Not “just” a listing platform** — operations, deal file, and broker workflows are first-class.
- **Not “just” a CRM** — cross-marketplace intelligence, compliance-adjacent structure, and learning hooks are built in.

👉 **Positioning line:** *An AI operating system for real estate transactions* — humans stay accountable; software assists, ranks, and learns within explicit safety rails.

---

## 6. Business Model

Revenue streams (staged; subject to product packaging and market):

- **Broker subscriptions** (workspace / premium tiers)
- **Premium AI & automation tools** (assistive features, reports, exports)
- **Investor / market reports** (documented as estimates, not securities advice)
- **Transaction-linked fees** (where contractually and regulatorily appropriate)

---

## 7. Traction (initial)

**Update this table from live admin metrics** (`/dashboard/investor/platform` for authorized operators) or your analytics warehouse.

| Metric | Value (fill in) | Notes |
|--------|-----------------|--------|
| Leads captured (all time) | — | CRM `Lead` rows |
| Brokers onboarded | — | Role / workspace signal |
| Active deals tracked | — | Non-terminal `Deal` rows |
| Revenue (rolling 30d) | — | Internal revenue events + Stripe reconciliation |
| Conversion (proxy) | — | Defined in `metricsEngine` / investor funnel module |
| Learning patterns extracted | — | `LearningPattern` count / top patterns |

*We do not fabricate traction. Replace “—” with audited numbers before external distribution.*

---

## 8. Vision

- **Self-improving marketplace** — measured loops from outcomes → patterns → better defaults (within review gates).
- **Stronger AI-assisted execution** — more assistive tooling, never a substitute for regulatory duties (e.g. OACIQ).
- **Selective investor / capital markets expansion** — only where product and compliance are aligned.
- **Global expansion** — long-term optionality; near-term depth in target geographies first.

---

## 9. Ask

| Pillar | Draft (edit) |
|--------|----------------|
| **Funding** | $[ ] seed / extension to reach [milestones] |
| **Use of proceeds** | Product (funnel + deal intelligence), GTM (brokers), compliance/legal, key hires |
| **Hiring** | [roles: e.g. brokerage success, ML/eng, compliance counsel] |
| **Milestones (12–18 mo)** | [ARR, broker count, retained leads, deal volume — define measurably] |

---

## Execution roadmap (30 / 60 / 90 days)

### Phase 1 — Day 0–30: Foundation + revenue ready

**Objective:** capture leads, enable baseline monetization, validate product.

| Build | Status (check against repo) |
|-------|-------------------------------|
| Lead funnel + attribution | Lead model + sources; instrument key entry points |
| Listing conversion (CTA, capture before full access) | Align with marketing + listing detail flows |
| Broker dashboard v1 (leads, sources, counts) | Dashboard routes under `/(dashboard)/dashboard/broker` |
| Insurance visibility (ACTIVE/EXPIRED, coverage summary) | Surfaced where compliance snapshots exist |
| Stripe (reports, premium) | Existing billing routes / webhooks — verify envs per environment |

**Success metrics (targets):** ≥20 leads · ≥1 paid feature use · ≥3 brokers onboarded.

### Phase 2 — Day 30–60: Intelligence layer

**Objective:** improve conversion; differentiate with AI assistance.

| Build | Status |
|-------|--------|
| Deal engine (`dealScore`, `closeProbability`) | Deal intelligence pipeline + events |
| AI broker assistant | `modules/assistant` — suggest-only |
| Compliance signals + logging | Cases / snapshots / events as modeled |
| Analytics dashboard | Funnel + source splits (CENTRIS vs LECIPM via `distributionChannel` / source) |

**Success metrics:** conversion uplift (define baseline A) · ≥50 active leads · ≥10 tracked deals.

### Phase 3 — Day 60–90: Autonomy + scale

**Objective:** differentiated story + investor-ready proof.

| Build | Status |
|-------|--------|
| Learning engine | `DealOutcome`, `LearningPattern`, maintenance runner |
| Investment engine | CRM listing opportunity snapshots — advisory |
| Marketplace optimizer | Threshold-based suggestions — review-first |
| Broker performance scoring | Success + responsiveness proxies (define methodology) |

**Success metrics:** measurable patterns · ≥1 polished investor demo · ≥100 cumulative leads.

---

## Safety + compliance (Québec & brokerage context)

- **Law 25 (privacy):** consent and purpose limitation for personal data; data minimization; retention and access controls; documented subprocessors where applicable.
- **Lead capture:** marketing consent and CRM consent paths must be clear; unsubscribe / suppression honored.
- **CENTRIS / syndication:** use partner data only under contract and displayed rules — **no unauthorized ingestion or redistribution**.
- **Broker regulation (OACIQ):** AI assists; it does not replace mandated disclosures, agency duties, or supervision.
- **Investment messaging:** ROI and rankings are **signals / estimates**, not guarantees — align with securities and advertising norms.

---

## Appendix — Internal links

- Platform traction MVP (admin, locale-aware): **`/{locale}/{country}/dashboard/investor/platform`**  
  Example: `/en/ca/dashboard/investor/platform`
- Admin investor workspace (extended): **`/admin/investor/metrics`**

---

*This document is for fundraising positioning and operational alignment. Numbers must be validated before investor circulation.*
