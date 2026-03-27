# Enterprise sales system — BNHub + LECIPM

**Purpose:** Acquire and nurture **high-value B2B partners** (property managers, agencies, multi-unit operators) with a **clear pipeline**, **honest value props**, and **measurable activity**. Closures are **not guaranteed** — discipline and iteration are.

**Product:** Admin CRM at **`/admin/sales-dashboard`** · Data: `enterprise_leads` (see Prisma). **Scripts:** [sales-scripts.md](sales-scripts.md).

---

## Target clients

| Segment | Needs | Pain points | BNHub / LECIPM value |
|---------|--------|-------------|----------------------|
| **Property management companies** | Occupancy, fewer tools | Fragmented OTAs, ops overhead | Central listing + booking; reporting |
| **Real estate agencies** | New revenue lines | No STR product | Branded stays; trust of brokerage |
| **Multi-property hosts** | Scale without chaos | Calendar/pricing sprawl | Channel tools, analytics (as shipped) |
| **STR operators** | Yield, compliance | Thin margins, support load | Verification narrative; partner support |
| **Travel-related businesses** | Packages, attachment | Weak inventory access | Curated supply; deep links |

*(Tune rows per market; avoid promising features not in production.)*

---

## Value proposition (realistic)

- **Visibility** — Listings can appear in BNHub search and campaigns where inventory and policy allow. **Measure** with impressions/clicks/bookings, not guarantees.
- **Bookings** — **Potential** to increase conversions when supply quality and pricing match demand — track per partner.
- **Operations** — Calendar, pricing, and dashboards **as available** in product; simplify vs juggling many disconnected tools.
- **Integrated services** — Payments, messaging, trust workflows on-platform; reduces handoffs when fully adopted.

---

## Sales pipeline (stages)

1. **Lead identified** — Named account + contact.  
2. **Contacted** — First outbound sent.  
3. **Interested** — Reply or meeting intent.  
4. **Demo scheduled** — Time on calendar.  
5. **Negotiation** — Commercial terms, pilot scope.  
6. **Closed** — **Won** or **Lost** (always record outcome).

CRM fields map to enums `EnterpriseLeadStage` (see schema).

---

## Scripts

Central copy: **[sales-scripts.md](sales-scripts.md)** — initial, follow-up, demo flow, closing. Customize with `{company}` / `{city}` before send.

---

## Tracking

- **Activity:** touches, replies, demos (notes + stage changes).  
- **Economics:** `deal_value_estimate_cents` (optional); sum on dashboard for filtered view.  
- **Conversion:** stage-to-stage rates weekly ([sales-review.md](sales-review.md)).  
- **Post-sale:** GMV/ bookings attributed to partner (UTM + internal tags when wired).

---

## Closing process

- Align on **pilot size** (listing count, duration).  
- Simple **order form or MSA** per legal counsel.  
- **No heavy commitment** early — match [sales-scripts.md](sales-scripts.md) closing frame.  
- Log **closed lost** reasons for learning.

---

## Deal structure (keep simple early)

- **Onboarding pilot** — Small number of listings (e.g. 3–10) and a fixed review date (e.g. 60–90 days).  
- **Optional premium** — Featured placement, API access, or dedicated support only when product and legal are ready.  
- **Terms** — Short written summary: fees, payout timing, offboarding, data use. Escalate complex MSAs to counsel.

Record estimated value in CRM as **deal_value_estimate_cents** for pipeline reporting only — not a forecast commitment.

---

## Post-sale onboarding

See **[partner-onboarding.md](partner-onboarding.md)** — data collection, verification, publish, performance review.

---

## Light automation

- **Follow-up:** `follow_up_at` on leads; “+7d” shortcut in dashboard.  
- **Stage updates:** drive reporting only; optional `syncScoreFromStage` on PATCH to refresh heuristic score.  
- **Lead score:** 0–100; default suggestion from stage in `lib/enterprise/sales-lead-rules.ts` — override freely.

---

## Related docs

- [partnerships.md](partnerships.md) — partner types and integration expectations.  
- [enterprise-scaling-system.md](enterprise-scaling-system.md) — broader enterprise readiness.

---

## Validation checklist

- [ ] Migration applied (`enterprise_leads`).  
- [ ] Sales owner uses `/admin/sales-dashboard` weekly.  
- [ ] Scripts customized for your city and compliance.  
- [ ] Legal review for any commitment language in email.  
- [ ] Partner onboarding checklist shared with ops after first win.
