# LECIPM client & product QA audit

**Auditor perspective:** First-time buyer/seller + conversion-focused reviewer  
**Date:** 2026-04-11  
**Method:** Codebase review of routes, components, and UX patterns; targeted UI fixes applied in-repo. Full E2E pass on every flow was not executed in this session—items marked *needs runtime QA* should be verified in staging.

---

## Executive summary

The platform already uses a coherent **black + gold** shell (`globals.css`, `lecipm-cta-*`, prestige pills). Main gaps addressed in this pass: **misleading footer social placeholders**, **marketing nav without active state**, **homepage clarity and trust cues**, **search empty-state CTAs**, **auth error accessibility**, and **signup secondary actions** brand alignment. Deeper dashboard/BNHub/booking flows remain dependent on **seed data, auth, and payment config** for meaningful validation.

---

## Homepage `/`

| | |
|---|---|
| **What works** | Clear headline; primary CTA “Explore listings” is visually dominant (solid gold); video section explains product. |
| **What felt wrong** | Subcopy was long; four equal-weight CTAs competed; no compact trust strip; AI scope needed modest disclaimer. |
| **Client risk** | Medium — confusion on “what to do first” and overclaiming AI. |
| **Fix applied** | Tightened hero description; added one-line **AI disclaimer**; added **Trust & standards** strip (security, OACIQ context, geography); grouped CTAs with `aria-label` naming Explore as primary. |
| **Priority** | High |

---

## Global navigation (marketing `Navbar`)

| | |
|---|---|
| **What works** | Gold border header; touch-friendly mobile menu; hubs linked. |
| **What felt wrong** | No **active route** indication on desktop or mobile. |
| **Client risk** | Low–Medium — wayfinding suffers on multi-page sessions. |
| **Fix applied** | `usePathname()` + active styles (gold border/fill); `aria-current="page"`; BNHUB prefix matching for `/bnhub/*`. |
| **Priority** | High |

---

## Header (investment shell) `HeaderClient`

| | |
|---|---|
| **What works** | Analyze / Explore / Dashboard / Compare with underline active states; phone CTA. |
| **What felt wrong** | *Not modified in this pass* — already strong. |
| **Client risk** | Low |
| **Fix applied** | — |
| **Priority** | Low |

---

## Footer `FooterClient`

| | |
|---|---|
| **What works** | Multi-column legal/support/contact; privacy/terms; trust blurb. |
| **What felt wrong** | **Placeholder** LinkedIn / Instagram / X chips appeared when real social URLs were absent — looked like dead links. |
| **Client risk** | **High (trust)** — implies social presence without links. |
| **Fix applied** | Removed fake social badges; only render real links from `getPublicSocialLinks()`. |
| **Priority** | Critical |

---

## Search & listings `/explore` (and embedded browse)

| | |
|---|---|
| **What works** | Filters, map modes, skeleton loading, error retry. |
| **What felt wrong** | No-results secondary CTA used low-contrast white ghost; copy didn’t mention stays separately. |
| **Client risk** | Medium — users bounce if next step isn’t obvious. |
| **Fix applied** | Empty state: **gold-outline** secondary CTA; primary uses `lecipm-cta-gold-solid`; clearer description; `EmptyState` container uses **gold dashed border** for brand consistency. |
| **Priority** | High |

---

## Listing detail (buyer view)

| | |
|---|---|
| **What works** | Rich FSBO/broker detail, galleries, mortgage, legal modals, contact gates. |
| **What felt wrong** | *No code change this pass* — surface is large; recommend *runtime* pass for CTA density and mobile gallery. |
| **Client risk** | Medium — *needs device QA* |
| **Fix applied** | — |
| **Priority** | Medium (ongoing) |

---

## Buy / Sell / Rent

| | |
|---|---|
| **Routes** | `/buying`, `/sell`, `/list-your-property`, `/bnhub/stays` (rent/stays). |
| **What felt wrong** | *Spot-check only* — flows are split across many components; consistency depends on each page using shared CTA classes. |
| **Fix applied** | Indirect: global CTA utilities and nav/footer polish. |
| **Priority** | Medium — *needs hub-by-hub content review* |

---

## BNHub stays & booking

| | |
|---|---|
| **What works** | `StaysGuestBookingDashboard`, featured/sponsored listings. |
| **What felt wrong** | *Not deeply audited* — payment, host trust, and price breakdown require **logged-in / Stripe** environments. |
| **Client risk** | Medium–High for launch — *needs end-to-end booking test* |
| **Fix applied** | — |
| **Priority** | High for *runtime QA* |

---

## Auth — sign in `/auth/login`

| | |
|---|---|
| **What works** | 2FA path, demo blocks behind env flags, success copy for registered/verified. |
| **What felt wrong** | Errors were plain red text; Suspense fallback was a single line. |
| **Client risk** | Medium — accessibility and perceived polish. |
| **Fix applied** | Error in **alert**-styled panel with border; **skeleton** fallback for login form. |
| **Priority** | High |

---

## Auth — sign up `/signup`

| | |
|---|---|
| **What works** | Clear create-account heading; link to sign in. |
| **What felt wrong** | Secondary actions (“Skip to onboarding”, “Explore projects”) looked like generic gray buttons. |
| **Client risk** | Low–Medium |
| **Fix applied** | Gold-outline styling for both secondary links. |
| **Priority** | Medium |

---

## Broker hub `/dashboard/broker`

| | |
|---|---|
| **What works** | Rich dashboard: stats, AI panels, leads, commissions (*when data exists*). |
| **What felt wrong** | Empty broker experience depends on DB seed; not altered in UI this pass. |
| **Client risk** | Medium for empty tenants — *recommend empty-state audit with zero rows* |
| **Fix applied** | — |
| **Priority** | Medium (data-dependent) |

---

## Investor hub `/dashboard` (portfolio)

| | |
|---|---|
| **What works** | MvpNav, deals, watchlist, feeds. |
| **What felt wrong** | Requires auth + investment data for full value. |
| **Fix applied** | — |
| **Priority** | Medium |

---

## Admin `/admin`

| | |
|---|---|
| **What works** | Separate shell; global marketing header hidden. |
| **What felt wrong** | *Not reviewed in this pass* (large surface). |
| **Fix applied** | — |
| **Priority** | Ongoing |

---

## Mobile + responsive

| | |
|---|---|
| **What works** | Marketing nav scroll drawer; footer padding for docks; investment mobile nav documented elsewhere. |
| **What felt wrong** | *Partial* — full modal/form audit not done. |
| **Fix applied** | Nav active states apply to mobile links; login skeleton improves perceived load. |
| **Priority** | Medium |

---

## Files touched (implementation)

| File | Change |
|------|--------|
| `apps/web/components/layout/FooterClient.tsx` | Remove fake social placeholders |
| `apps/web/components/marketing/Navbar.tsx` | Active route highlighting |
| `apps/web/components/marketing/LecipmHomeLanding.tsx` | Hero copy, AI disclaimer, trust strip, CTA group label |
| `apps/web/components/ui/EmptyState.tsx` | Gold-tinted empty container |
| `apps/web/components/listings/ListingsBrowseClient.tsx` | No-results CTAs + copy |
| `apps/web/app/auth/login/auth-login-client.tsx` | Error alert styling, login skeleton |
| `apps/web/app/signup/signup-page-client.tsx` | Secondary link gold styling |

---

## Critical issues found

1. **Footer fake social badges** when URLs missing — **fixed** (was a trust defect).
2. **Marketing nav had no active state** — **fixed**.
3. **Homepage** lacked compact **trust / compliance** cues next to AI claims — **partially addressed** (strip + disclaimer).
4. **Listings empty state** secondary action didn’t match premium CTA system — **fixed**.

---

## Areas still needing backend / data support

- **BNHub booking**: end-to-end payment, cancellation, and confirmation emails — needs Stripe + webhooks verified.
- **Listing detail**: contact unlock, CRM vs FSBO — behavior depends on `listingKind` and server rules.
- **Broker/investor dashboards**: empty states with real copy when counts are zero — needs product copy + optional API defaults.
- **Search**: relevance and count when DB sparse — product/marketing decision, not only UI.
- **Admin**: role-gated actions — verify RLS and audit logs in staging.

---

## Top 10 launch blockers *(process + product)*

1. End-to-end **auth** (register → verify → login → dashboard) on production-like env  
2. **Stripe** (subscriptions, BNHub checkout, host payouts) with webhooks  
3. **Listing publication** pipeline (FSBO + moderation) smoke test  
4. **Mobile** pass on listing detail + checkout + dashboards  
5. **Legal pages** accuracy vs live business (privacy, terms, brokerage disclaimers)  
6. **Contact / lead** delivery (email, CRM) not silently failing  
7. **404/500** monitoring and user-friendly error pages  
8. **Performance**: LCP on homepage and `/explore` with real data  
9. **SEO**: canonical URLs, `noindex` on staging  
10. **Accessibility**: focus traps in modals, form labels (partially addressed on login errors)

---

## Top 10 trust & conversion improvements *(including fixes above)*

1. Honest **AI disclaimers** (homepage — done)  
2. **No fake social proof** (footer — done)  
3. **Clear primary CTA** on home (group label — done)  
4. **Trust strip** on home (done)  
5. **Nav wayfinding** with active states (done)  
6. **Search zero-results** with strong next steps (done)  
7. Broker **license + contact** visible on broker page *(existing — keep accurate)*  
8. **Sign-in errors** visible and calm (done)  
9. **Signup** secondary paths on-brand (done)  
10. Add **testimonials / stats** only when verifiable — *content work, not invented in code*

---

## Top 10 polish improvements *(follow-up)*

1. Unify remaining **white-outline** buttons to **gold-outline** across marketing  
2. **Listing cards**: standardize price/location/badge hierarchy everywhere  
3. **BNHub**: trust row (reviews, host verification) on listing cards  
4. **Dashboard** empty states: illustration + one CTA each  
5. **Loading**: extend skeleton pattern beyond login (e.g. signup, checkout)  
6. **Toast** consistency for save/contact/booking success  
7. **Breadcrumbs** on deep listing URLs  
8. **Print** stylesheet for listing PDF/share  
9. **i18n**: audit FR pages for same trust strings  
10. **Analytics**: event naming audit for conversion funnel

---

## Sign-off

This audit is **documentation + implemented UI fixes**. It is **not** a substitute for staging regression tests, accessibility audit tools, or legal review of copy.
