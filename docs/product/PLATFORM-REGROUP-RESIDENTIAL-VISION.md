# Platform regroup: residential discovery, listing types, and dashboards

This document captures the **target information architecture** you described: free property research (portal-style), engagement (save / like), two listing models (owner-direct vs licensed broker), document completeness by type, and dashboards with uploads for everyone who participates.

It also maps **today’s codebase** so engineering and product can phase work without guessing.

---

## 1. Free property research (portal-style discovery)

**Intent:** Visitors search listed properties with rich filters (location, price range, property type, bedrooms, etc.)—similar in *spirit* to major Quebec listing portals—without paying to browse.

**In the product today**

| Surface | Role | Notes |
|--------|------|--------|
| FSBO public catalog | Residential owner-direct listings | `GET /api/fsbo/search`, city pages, `/sell` browse strip, `/sell/[id]` detail |
| BNHub search | Short-term stays / rentals | `/search/bnhub`, `/api/bnhub/search` — **different vertical** (stays), not resale MLS-style |
| Compare | Side-by-side FSBO | `/compare/fsbo` |

**Target state**

- A clear **Residential** entry point (marketing + nav) that points to the unified discovery experience you want—starting by **aggregating FSBO** and any **broker-represented resale** inventory you expose publicly.
- Filters and result cards should feel familiar to portal users: map/list, sort, key facts, badges.

**Engineering note:** “One search UI, two backend sources” is a deliberate integration project: normalize a **listing source** dimension (e.g. `OWNER_DIRECT` | `BROKER`) and a shared card/detail contract, then federate queries or a single materialized view—depending on scale and legal constraints on broker data.

---

## 2. Engagement: view list + “love” (favorite)

**Intent:** If searchers like a property, they can add it to a **view list** and/or tap **like** (heart)—simple, emotional, fast.

**In the product today**

| Mechanism | Where | Persistence |
|-----------|--------|-------------|
| `SaveListingButton` | BNHub listing UI | `localStorage` key `bnhub_saved_listing_ids` |
| Project favorites | Projects marketplace | `/api/projects/favorites` (authenticated) |

**Target state**

- For **residential** listings (FSBO + broker): **account-based** saved list when logged in, with optional guest/local fallback—same heart pattern as BNHub for consistency.
- “View list” can be the same collection as “saved” or a separate list (shortlist vs favorites)—product choice; technically both are saved rows with different tags.

---

## 3. Contact + two listing types + documents

**Intent:** When someone wants to contact the listing, the flow depends on **who published it**:

1. **Client / owner listing themselves** — owner-direct (FSBO-style) path: inquiries go to the seller workflow you define; **document packet A** (seller forms, declarations, etc.).
2. **Licensed broker listing** — professional path: contact and obligations follow brokerage rules; **document packet B** (brokerage forms, agency, etc.).

Every complete listing should eventually carry **the right attachments** for its type; “letter” and final legal copy can be layered later without blocking UX structure.

**In the product today**

- FSBO listings have moderation and public detail pages; dashboard for owners: `/(dashboard)/dashboard/fsbo` (and related APIs).
- Broker tooling exists in the broader app (CRM, listing access, commissions, etc.); BNHub listings can mark broker authority on **stays** (`listingAuthorityType` / broker CTAs)—**resale broker listings** as a separate public catalog may still need modeling or import if not already exposed as FSBO.

**Target state**

- On every listing card and detail page: **visible badge** (“Owner listing” vs “Broker listing”) and **contact CTA** that routes to the correct conversation or lead capture.
- **Document checklist** per listing type (UI + storage): required uploads before “complete” — aligns with your requirement that *all* listings are complete with *different* documents per path.

---

## 4. Dashboards: uploads for everyone

**Intent:** Anyone who uses the platform in a serious way has a **dashboard** where they can **upload documents and photos**; more advanced seller/broker features come later on top of that base.

**In the product today**

- FSBO dashboard for sellers (`/dashboard/fsbo`).
- Broker hub (`/dashboard/broker`, CRM, listings, etc.).
- Other hubs (real estate, projects, investments) each have their own modules.

**Target state**

- **Baseline capability:** a consistent **“Media & documents”** pattern (upload, status, required vs optional) reused across seller and broker dashboards—so “upload everything here” is true in general, with role-specific steps (compliance, brokerage packet) added in later phases.

Reference inspiration you mentioned (external sites) should inform **UX patterns** only—implementation stays in your brand and data model.

---

## 5. Free clients who want to list (owner-direct)

**Intent:** Sellers who list with you without a traditional full-service package get a **self-serve, guided flow**—similar in *spirit* to owner-direct listing products: clear pricing, steps, and dashboard to manage the listing.

**In the product today**

- `/sell` explains FSBO paths, pricing, and links into listing flows.
- FSBO listing creation and management live under the seller dashboard and admin moderation.

**Target state**

- Tighten the **onboarding funnel**: search → sell CTA → wizard → dashboard, with document and photo requirements visible upfront.

---

## 6. Suggested delivery phases

| Phase | Outcome |
|-------|---------|
| **P0 — IA & copy** | Nav/marketing: “Browse properties” (residential) vs “Stays” (BNHub) so visitors are not confused. |
| **P1 — Unified residential browse** | Single search page merging FSBO (and broker resale when available); listing source badge; shared card component. |
| **P2 — Saved / heart** | Authenticated favorites API for residential IDs; heart on cards; “My list” page. |
| **P3 — Contact routing** | Lead forms / messaging rules by listing type; broker vs owner templates. |
| **P4 — Document completeness** | Checklists + upload slots per listing type; admin review if needed. |
| **P5 — Dashboard parity** | Shared upload/document primitives across seller and broker dashboards. |

---

## 7. Open decisions (for you / PM)

- Should **short-term (BNHub)** remain a sibling product with its own search, or be de-emphasized in nav relative to **residential**?
- Will **broker resale** inventory be entered only inside your platform, or synced from external feeds (legal/licensing constraints)?
- Should “love” and “save” be one action or two (e.g. heart = like, bookmark = shortlist)?

---

## 8. Related internal docs

- `docs/product/LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md` — broader PRD
- `docs/BNHUB-MODULE.md` — stays marketplace
- `docs/AUTH_ONBOARDING.md` — accounts for saved lists

This file is the **north-star structure** for the regroup you described; iterate here as decisions land.
