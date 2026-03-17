# LECIPM Platform — UI/UX Design System Blueprint

**Unified design system for the LECIPM ecosystem**

This document defines the UI/UX design system for the LECIPM platform: visual identity, interaction principles, component and layout standards, trust and safety visual language, accessibility, responsiveness, and premium brand consistency across web and mobile. It ensures visual consistency, usability, accessibility, trust, and quality for all products and user roles. It aligns with the [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), and [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md). Product designers, frontend engineers, and AI coding tools use this blueprint to build interfaces that feel premium, trustworthy, and consistent.

---

## 1. Design system vision

### Role of the design system in LECIPM

The design system is the **single source of truth** for how LECIPM looks, feels, and behaves across:

- Real estate marketplace, BNHub short-term rentals, Broker CRM, Owner dashboard, Deal marketplace, Investment analytics, Trust & Safety, AI Control Center, and mobile apps.

It provides:

- **Shared vocabulary** — Tokens, components, and patterns that every surface uses.
- **Trust and clarity** — Rules so pricing, safety, and status are always clear and never hidden.
- **Efficiency** — Design and build once; reuse everywhere; reduce drift and rework.
- **Quality bar** — Accessibility, contrast, touch targets, and motion standards built in.

### Design goals

| Goal | Meaning |
|------|---------|
| **Premium** | Polished, considered details (typography, spacing, motion) without looking flashy or wasteful. |
| **Trustworthy** | Verification, transparency, and safety are visible and understandable; no dark patterns. |
| **Transparent** | Fees, policies, and status are explicit; no hidden charges or vague wording. |
| **Modern** | Contemporary patterns (cards, clear hierarchy, ample whitespace) without trend-chasing. |
| **Scalable** | Tokens and components scale to new pages, roles, and platforms without one-off designs. |
| **Accessible** | WCAG 2.1 AA baseline; keyboard, screen reader, contrast, and focus built into components. |
| **Cross-platform consistent** | Same visual language on web, iOS, and Android; platform-native only where necessary. |
| **Role-aware** | One system; density, emphasis, and flows adapt by role (guest vs host vs admin) without fragmenting the brand. |

### How the design system supports stakeholders

| Stakeholder | How the system helps |
|-------------|----------------------|
| **Users** | Predictable, clear, and trustworthy UI; same patterns for search, booking, and payments everywhere. |
| **Designers** | Clear tokens, components, and patterns; less reinvention; faster iteration and handoff. |
| **Frontend engineers** | Implementable tokens and component specs; fewer design-back-and-forths; consistent code. |
| **Product teams** | Shared quality bar; role-based patterns; trust and safety built into the system. |
| **AI coding tools** | Structured rules (tokens, variants, states, usage) so generated UI aligns with the system. |

---

## 2. Brand experience principles

### Core brand principles

| Principle | Application in the interface |
|-----------|------------------------------|
| **Trust first** | Verification badges, clear policies, and safety entry points are visible where relevant. No dark patterns; consent and data use are explicit. |
| **Clarity over clutter** | One primary action per area; secondary actions de-emphasized; information hierarchy clear. |
| **Premium but practical** | Refined typography and spacing; no unnecessary decoration. Every element supports task completion or understanding. |
| **Transparency in every transaction** | Price breakdowns before payment; fees and taxes labeled; cancellation and refund rules visible. |
| **Safety by design** | Incident reporting, dispute flows, and hold notices are easy to find and use; language is calm and factual. |
| **Calm and confident interface language** | Copy is concise, neutral, and helpful. Errors explain what happened and what to do next; no blame or alarm. |
| **Investor-grade professionalism** | Analytics and financial data are legible, accurate, and free of casual or playful tone. |
| **Real-estate and hospitality credibility** | Listings and booking flows feel reliable and hospitable; property and host info is structured and scannable. |

### Emotional tone

The interface should feel **calm, confident, and capable**. Users should feel that the platform is on their side: clear about rules, fair about money, and ready to help when something goes wrong. It should never feel anxious, salesy, or opaque.

---

## 3. Visual identity foundations

### Brand personality

- **Authoritative but approachable** — Professional enough for brokers and investors; welcoming enough for guests and hosts.
- **Clear and structured** — Information is organized; scanning and comparison are easy.
- **Warm but not casual** — Hospitality warmth in imagery and microcopy; no slang or gimmicks in core flows.

### Visual tone

- **Light-dominant** — Primary surfaces are light; dark accents for emphasis and contrast. Dark mode can be supported with the same token roles.
- **High legibility** — Sufficient contrast, clear type hierarchy, and consistent spacing so content is easy to read and scan.
- **Restrained color** — Brand color used for primary actions and key highlights; neutrals carry most of the layout; semantic color (success, warning, error) used consistently.

### Balance: luxury vs practicality

- **Luxury** appears in: typography quality, generous whitespace, thoughtful motion, and polished imagery—not in heavy decoration or ornate patterns.
- **Practicality** appears in: obvious CTAs, scannable lists, clear labels, and fast-loading layouts. Every screen serves a task or decision.

### Differentiation

- **Modern marketplace look** — Card-based layouts, clear imagery, filters and sort; distinct from cluttered classifieds.
- **Enterprise dashboard credibility** — Dashboards use consistent charts, tables, and KPIs; no toy-like or consumer-only styling in broker/admin views.
- **Hospitality warmth** — BNHub listing and booking flows feel welcoming (imagery, host profile, clear dates and price) without feeling like a travel brochure.
- **Financial clarity** — Numbers (prices, payouts, analytics) are aligned, formatted consistently, and use a clear numeric/currency style.

---

## 4. Color system

### Architecture

Colors are defined by **role**, not by literal hue. Implement with design tokens (e.g. `color.primary`, `color.surface.1`) so brand values can change in one place.

### Primary brand colors

- **Primary** — Main brand color; used for primary buttons, key links, and selected states. One primary hue; avoid multiple competing brand colors.
- **Primary hover / active** — Darker (or lighter) variant for hover and pressed states; must meet contrast on white or on primary for text.
- **Primary subtle** — Very light tint for backgrounds (e.g. selected tab, highlight strip). Low saturation so it doesn’t compete with content.

**Usage:** One primary CTA per section; primary for key nav highlights (e.g. current section). Do not use primary for large areas of background.

### Secondary colors

- **Secondary** — Supporting actions (secondary buttons, secondary links). Visually distinct from primary but harmonious.
- **Secondary hover / active** — Defined variants for interaction.

**Usage:** Secondary for “Cancel”, “Back”, “See all” type actions. Do not use for the main submit or purchase action.

### Neutral palette

- **Neutral scale** — 8–10 steps from lightest (near white) to darkest (near black). Use for text, borders, and surfaces.
  - **Text primary** — Highest contrast (e.g. neutral.900); body and headings.
  - **Text secondary** — Mid contrast (e.g. neutral.600); captions, hints, metadata.
  - **Text tertiary / disabled** — Lower contrast (e.g. neutral.500); disabled controls, placeholders.
  - **Border** — Light gray (e.g. neutral.200–300); dividers, card outlines.
  - **Surfaces** — neutral.50, neutral.100 for alternating or elevated areas.

**Usage:** Neutrals carry most of the UI; primary and semantic colors are accents.

### Surface colors

- **Background default** — Page background (e.g. neutral.50 or white).
- **Surface raised** — Cards, dropdowns (e.g. white or neutral.50); distinct from page background.
- **Surface overlay** — Modal/drawer background (e.g. white); overlay/scrim behind it (e.g. black 50% opacity).

**Usage:** Hierarchy: background &lt; surface raised &lt; surface overlay. Never use the same value for background and card if they should be visually separate.

### Success / warning / error / info

- **Success** — Green family; confirmations, success states, positive trends, verified.
- **Warning** — Amber/orange; caution, pending action, soft alerts.
- **Error** — Red family; validation errors, destructive actions, failure states.
- **Info** — Blue family; informational notices, tips, neutral alerts.

Each has **default**, **hover/active**, and **background** (light tint) variants. Text on colored background must meet contrast (e.g. 4.5:1).

**Usage:** One semantic meaning per color; do not use error for “attention” when warning is correct.

### Trust and safety alert colors

- **Safety / trust** — Can reuse success green for “Verified”, “Safe”; or a dedicated teal if brand has one.
- **Alert / hold** — Amber for “Payout on hold”, “Action required”; distinct from error so it doesn’t read as “broken”.
- **Critical / incident** — Red for critical safety or fraud alerts in admin/support; use sparingly in consumer UI.

**Usage:** Trust badges use success/safety color; holds and required actions use warning; critical issues use error with calm copy.

### Chart support colors

- **Data series** — 6–8 distinct colors that are distinguishable in both color and when printed in grayscale. Use for line/bar/area charts.
- **Categorical** — Same palette for donuts and legends; avoid red/green only (accessibility).
- **Trend** — Positive (e.g. success green), negative (e.g. error red), neutral (e.g. neutral.500).

### Dark mode (if applicable)

- **Token swap** — Same token names; values change (e.g. background becomes dark, text becomes light).
- **Surfaces** — Dark gray steps instead of light; borders slightly lighter than background.
- **Primary/semantic** — Slightly adjusted for contrast on dark; avoid pure white text on bright primary.

**Usage rules:** All roles (primary, text, surface, semantic) have clear rules; no hard-coded hex in components.

---

## 5. Typography system

### Font families

- **Primary (UI and body)** — Sans-serif, highly legible (e.g. Inter, Source Sans, or brand font). Used for body, labels, buttons, tables.
- **Secondary (optional)** — Distinct font for headings only if brand requires; otherwise one family with weight scale.
- **Monospace (optional)** — For IDs, code, or numeric data in tables; use sparingly.

**Rule:** Maximum two families in main UI; avoid mixing many weights in one view.

### Heading hierarchy

- **H1** — Page title; one per page; largest size (e.g. 2rem–2.5rem); semibold or bold.
- **H2** — Section title; clear step down from H1 (e.g. 1.5rem).
- **H3** — Subsection (e.g. 1.25rem).
- **H4–H6** — Smaller sections and card titles; scale down consistently (e.g. 1.125rem, 1rem, 0.875rem).

**Rule:** Logical order (H1 → H2 → H3); don’t skip levels for style.

### Body text hierarchy

- **Body large** — Intro or emphasis paragraphs (e.g. 1.125rem); line height 1.5–1.6.
- **Body default** — Standard paragraphs and list content (e.g. 1rem).
- **Body small** — Secondary copy, captions under images (e.g. 0.875rem).

**Rule:** Line height ≥1.5 for body; increase for long reading (e.g. legal, help).

### Labels and captions

- **Label** — Form labels, table headers, card metadata; size one step below body (e.g. 0.875rem); medium weight or uppercase with letter-spacing.
- **Caption** — Timestamps, hints, “Optional”; smallest readable (e.g. 0.75rem); secondary color.

### Table text

- **Cell** — Body default or body small; consistent alignment (numbers right, text left).
- **Header** — Label style; sort indicators when sortable.

### Button text

- **Primary/secondary** — Same size as body or label (e.g. 0.875rem–1rem); medium or semibold; no all-caps unless short (e.g. “OK”).

### Numeric and pricing text

- **Price** — Prominent size (e.g. 1.25rem–1.5rem for main price); tabular figures so digits align in lists.
- **Currency** — Same font; symbol or code before/after per locale.
- **Large metrics** — Dashboard KPIs can be larger (e.g. 2rem); tabular figures.

### Dashboard metric typography

- **KPI value** — Large, bold, tabular; one metric per card or row.
- **KPI label** — Caption or label below; secondary color.
- **Trend** — Small, with up/down indicator and semantic color.

### Readability

- **Minimum size** — 16px (1rem) for body on mobile to avoid zoom; 14px minimum for secondary text.
- **Line length** — 45–75 characters for long-form; wider for tables and dashboards.
- **Contrast** — Text on background meets WCAG AA (4.5:1 for normal, 3:1 for large).

---

## 6. Spacing and sizing system

### Spacing scale

Use a **consistent scale** (e.g. 4px base: 0, 4, 8, 12, 16, 24, 32, 48, 64, 96). Map to tokens: `space.0` through `space.10` or similar.

**Rule:** No arbitrary values (e.g. 13px, 37px); use scale so alignment and rhythm stay consistent.

### Padding standards

- **Cards** — Padding from scale (e.g. 16, 24); same on all sides or slightly larger horizontal.
- **Sections** — Vertical padding between sections (e.g. 32, 48); horizontal aligned with container.
- **Buttons** — Vertical 8–12, horizontal 16–24; scale with button size.
- **Inputs** — Vertical 10–12, horizontal 12–16; consistent height (e.g. 40px or 44px for touch).

### Margin standards

- **Between elements** — Same scale (e.g. 8 between inline elements, 16 between blocks).
- **Between sections** — Larger (e.g. 32, 48) to create clear grouping.

### Section spacing

- **Page sections** — 48–64 vertical between major sections on desktop; 32 on mobile.
- **Card internal** — 16–24 between card content blocks.

### Form spacing

- **Between fields** — 16–24 vertical.
- **Between label and input** — 4–8.
- **Between error and next field** — 4–8.

### Modal spacing

- **Modal padding** — 24–32; consistent with card padding.
- **Modal footer** — 24 top; buttons with gap 12–16.

**Consistency:** Same scale everywhere; spacing creates clear grouping and reduces visual noise.

---

## 7. Grid and layout system

### Page width standards

- **Max content width** — 1280px or 1440px for reading and forms; center on large screens.
- **Full-bleed** — Hero, footer, or feature sections can extend edge-to-edge with content inside max-width container.

### Container sizes

- **Narrow** — 640px; forms, checkout, settings.
- **Default** — 768–896px; article, detail main column.
- **Wide** — 1280px; dashboards, search results with sidebar.
- **Full** — 100% with padding; admin tables, map views.

### Responsive grid

- **Desktop** — 12 columns; gutter 24px (or 16px).
- **Tablet** — 8 columns; same or smaller gutter.
- **Mobile** — 4 columns or single column; gutter 16px.

### Column logic

- **Listing grid** — 3–4 columns desktop; 2 tablet; 1 mobile. Card min-width or breakpoint-driven.
- **Detail + sidebar** — Main 8–9 cols, sidebar 3–4 cols on desktop; stack on mobile (main first, then sidebar).
- **Dashboard** — 12-col; KPI cards in 3–4 cols each; charts full width or 8+4.

### Card grid behavior

- **Uniform cards** — Same height per row or stretch to fill; gap from spacing scale (16–24).
- **Masonry** — Avoid for core listing grids; use only if content height varies greatly and layout permits.

### Listing detail layout

- **Gallery** — Full width or 7–8 cols; aspect ratio consistent (e.g. 16:10 or 4:3).
- **Key info + CTA** — Sidebar 4–5 cols or below gallery on mobile; sticky on desktop.
- **Content** — Full width below fold; sections with consistent vertical spacing.

### Checkout layout

- **Single column** — Max width 560px; centered; step indicator at top.
- **No sidebar** — All content in one flow; no competing CTAs.

### Admin layout

- **Sidebar** — 240–280px; collapsible to icons.
- **Main** — Fills remainder; content uses full width for tables; filters in bar or sidebar.

### Desktop, tablet, mobile

- **Desktop** — Multi-column; side nav; tables full; hover states.
- **Tablet** — Fewer columns; collapsible nav; tables scroll or card stack.
- **Mobile** — Single column; bottom nav or drawer; primary CTA sticky; touch targets ≥44px.

---

## 8. Iconography system

### Icon style

- **Single style** — One family (e.g. outline icons 24px default); avoid mixing outline and filled except for state (e.g. filled for “selected”).
- **Stroke** — Consistent stroke width (e.g. 1.5–2px); rounded caps and joins for a modern look.

### Line vs filled

- **Default** — Line (outline) for nav, actions, and lists.
- **Filled** — Selected state, primary action in a set, or “on” state (e.g. bookmark saved).
- **Rule** — Don’t mix line and filled for the same concept without a clear state meaning.

### Size system

- **Small** — 16px; inline with text, table actions.
- **Default** — 24px; nav, buttons, cards.
- **Large** — 32–48px; empty states, feature icons.
- **Rule** — Scale in 8px steps; same icon at different sizes keeps proportion.

### Dashboard icons

- **Nav** — One icon per item; 24px; consistent with rest of app.
- **KPI cards** — Optional small icon (16–24px) for category; don’t overcrowd.

### Marketplace icons

- **Amenities** — Consistent set (wifi, parking, etc.); same style as system icons or approved illustration set.
- **Listing type** — Property type icon in card and detail.

### Trust and safety icons

- **Verified** — Checkmark or shield; one canonical “verified” icon.
- **Warning** — Triangle or alert; same as system warning.
- **Report** — Flag or alert; used for “Report” actions.

### Consistency

- One icon set; one stroke weight; clear naming (e.g. `icon-check`, `icon-check-solid`). Document in design system; engineers use same names.

---

## 9. Elevation, borders, and surfaces

### Card surfaces

- **Default card** — White or surface.raised; border 1px neutral.200 or subtle shadow (e.g. shadow.sm).
- **Hover** — Slightly stronger shadow (e.g. shadow.md) for clickable cards; not for static cards.
- **Pressed** — Shadow reduced or border emphasis for pressed state.

### Modal surfaces

- **Modal** — Surface overlay; shadow.lg or xl; border radius 8–12px.
- **Scrim** — Semi-transparent dark (e.g. black 50%); behind modal.

### Page background surfaces

- **Default page** — Background default (e.g. neutral.50 or white).
- **Alternating** — Optional neutral.50 stripes in long lists; low contrast so it doesn’t dominate.

### Border radius

- **Scale** — 0, 4, 8, 12, 16px (or 0, 6, 12, 16); tokens radius.sm, radius.md, radius.lg.
- **Cards** — radius.md (8px) default.
- **Buttons** — radius.sm or radius.md.
- **Modals** — radius.lg.
- **Pills/badges** — radius.full (9999px) or large (e.g. 16px).

### Border weights

- **Default** — 1px; borders and dividers.
- **Emphasis** — 2px only for focus ring or critical separation.

### Shadow levels

- **sm** — Subtle lift (e.g. 0 1px 2px rgba(0,0,0,0.05)); cards at rest.
- **md** — Clear lift (e.g. 0 4px 6px rgba(0,0,0,0.07)); dropdowns, hover cards.
- **lg** — Modals, sticky headers.
- **xl** — Maximum separation (e.g. modal on scrim).

**Rule:** Few levels; use consistently. Don’t add one-off shadows.

### When to use flat vs elevated

- **Flat** — Same as background; use for inline elements or when elevation is provided by border.
- **Elevated** — Card, dropdown, modal; use shadow or border to separate from background. Use elevation to show hierarchy (card above page, modal above card).

---

## 10. Motion and interaction principles

### Hover behavior

- **Links** — Underline or color change; transition 150–200ms.
- **Buttons** — Slightly darker/lighter or shadow; cursor pointer; no layout shift.
- **Cards (clickable)** — Shadow or border change; optional slight scale (e.g. 1.01); 200ms ease.

### Focus behavior

- **Visible focus** — 2px outline or ring in primary or neutral; offset 2px; never remove focus outline without replacement.
- **Focus order** — Logical tab order; focus trap in modals.

### Pressed states

- **Buttons** — Slightly darker or scale 0.98; 100ms; clear feedback on click.

### Loading transitions

- **Skeleton** — Preferred for initial load; match content layout; subtle pulse.
- **Spinner** — For buttons (inline) or local refresh; size appropriate to context.
- **Progress** — For multi-step or file upload; linear or determinate when possible.

### Page transitions

- **Minimal** — Simple fade or no transition; avoid long or decorative transitions that delay content.
- **Mobile** — Optional slide for stack navigation (e.g. 200ms ease).

### Modal animations

- **Open** — Fade in scrim; scale or fade in content (200–300ms).
- **Close** — Reverse; same duration.
- **Rule** — Short and purposeful; no bounce or flashy effect.

### Drawer behavior

- **Slide** — From side; 250–300ms ease; overlay behind.
- **Swipe to close** — Optional on mobile; same direction as open.

### Toast and notification motion

- **Enter** — Slide in from top or bottom + fade; 200–300ms.
- **Exit** — Fade out or slide out; 200ms.
- **Rule** — Non-blocking; don’t animate too much so it feels like an ad.

**Principle:** Motion supports feedback and hierarchy; it should feel professional and not distracting. Respect `prefers-reduced-motion`: disable or shorten non-essential motion.

---

## 11. Core UX principles

| Principle | Application |
|-----------|-------------|
| **Reduce friction** | Fewer steps to complete tasks; autosave where appropriate; smart defaults; don’t ask for data we don’t need. |
| **Prioritize transparency** | Show price breakdown, fees, and policies before commitment; no surprise charges or vague status. |
| **Make next actions obvious** | One primary CTA per section; secondary actions visually de-emphasized; “Submit”, “Book”, “Save” clear. |
| **Always show system status** | Loading, success, error; progress in multi-step; “Saving…”, “Saved”; never leave user guessing. |
| **Prevent user error** | Validation before submit; confirm destructive actions; disable invalid combinations (e.g. check-out before check-in). |
| **Support recovery from mistakes** | Clear error message + next step; undo where possible; cancel and back options; support link when stuck. |
| **Role-appropriate complexity** | Guest: simple search and book. Host: more controls. Admin: dense but organized. Don’t show all options to everyone. |
| **Mobile-friendly decision flows** | Key flows (search, book, message) work on small screens; fewer steps; larger touch targets; sticky CTAs. |

---

## 12. Trust and transparency UX rules

| Rule | Implementation |
|------|-----------------|
| **No hidden charge design** | Total price visible before payment; all fees listed in breakdown; no pre-checked extras that add cost. |
| **Clear pricing breakdowns** | Line items: nights × rate, cleaning fee, service fee, tax; total prominent; same format on listing and checkout. |
| **Visible taxes and fees** | “Included” or “Added at checkout” stated; amount shown when known; link to fee policy if needed. |
| **Cancellation policy visibility** | Policy and refund tiers on listing and before payment; not only in footer; readable language. |
| **Verification badges** | Visible on profile and listing (identity, host, broker); one canonical badge style; “Verified” or “Identity verified”. |
| **Safety notices** | Where relevant (e.g. incident report, dispute); calm tone; easy to find from profile or booking. |
| **Dispute entry points** | “Open a dispute” or “Request refund” from booking/trip detail; not buried in help. |
| **Refund status visibility** | Status (Pending, Approved, Refunded) and expected date; same place as payment history. |
| **Incident reporting access** | Link in footer, profile, or booking; form is simple and doesn’t feel punitive. |
| **Payout hold explanations** | “Why is my payout on hold?” with reason and next steps; link to support; no alarmist language. |

**Principle:** Trust is visual (badges, clear type) and functional (easy to find help, dispute, and status). Every financial or safety-related screen should reinforce “we’re clear and on your side.”

---

## 13. Navigation design standards

### Top nav

- **Height** — 56–64px; consistent across app.
- **Contents** — Logo (left), primary links (center or left), search (center or right), messages + notifications + profile (right).
- **Sticky** — Optional on scroll; shadow when scrolled.
- **Mobile** — Hamburger or bottom nav; top bar with logo and search/menu.

### Sidebar nav

- **Width** — 240–280px expanded; 64–72px collapsed (icons only).
- **Items** — Icon + label; active state (background or border-left); group by section.
- **Collapse** — Icon only; tooltip on hover for label; expand on click or hover (desktop).

### Tab nav

- **Style** — Underline or pill for active; equal width or content-based.
- **Placement** — Below header or above content; don’t nest too deep (max 2 levels).

### Breadcrumb style

- **Format** — Home > Section > Page; separators clear; current page not linked; truncate long labels.
- **Placement** — Above title or below nav; same on all detail pages.

### Mobile bottom nav

- **Items** — 3–5; icon + label; equal width; active state clear.
- **Height** — 56–64px; safe area padding.
- **Badge** — Unread count on Messages/Notifications; dot only if many.

### Dropdown menus

- **Trigger** — Button or avatar; open on click; close on outside click or item select.
- **List** — Vertical; padding per item; divider between groups; icons optional.
- **Position** — Below trigger; align left/right to avoid overflow.

### Quick action menus

- **FAB or “+”** — Opens overlay or sheet with 2–4 actions; icon + label; one tap to action.
- **Context menu** — Long-press or right-click on card/row; same style as dropdown.

### Search-first patterns

- **Global search** — In header; focus opens suggestions or recent; submit goes to search results.
- **Context** — On Stays/Marketplace/Deals, search defaults to that context; switchable.

### Role-based changes

- **Guest** — Marketplace, Stays, Deals, Trips, Saved, Profile.
- **Host** — Add Host dashboard, Listings, Calendar, Reservations, Payouts.
- **Owner** — Add Owner dashboard, Portfolio, Revenue.
- **Broker** — Add CRM (Leads, Clients, Listings, Tasks).
- **Admin** — Separate app; no consumer nav; admin-specific sidebar.

---

## 14. Page templates and layout patterns

| Template | Anatomy | Use |
|----------|---------|-----|
| **Public marketing** | Header, hero/content, sections, footer; single column or full-bleed sections. | Homepage, about, features, pricing, help, legal. |
| **Search results** | Header, filters (sidebar or sheet), sort bar, result count, list/grid, optional map. | Property, BNHub, deal search. |
| **Listing detail** | Header, gallery, key info + CTA sidebar, description, amenities, rules, map, host/broker, reviews. | Property and BNHub listing. |
| **Dashboard** | Top bar, side nav, page title, KPI row, main content (charts, tables, cards). | Host, owner, broker, admin home. |
| **Admin operations** | Top bar, side nav, filters bar, table or list, pagination, bulk actions. | Users, listings, incidents, disputes. |
| **Form page** | Header, title, form (sections), submit/cancel; optional sidebar for help. | Settings, create listing, profile. |
| **Checkout** | Minimal header or progress, steps, single column form, sticky total/CTA. | Booking checkout, payment. |
| **Settings** | Sidebar or tabs for categories; main content for selected section. | Account, notifications, security. |
| **Inbox / messaging** | List (left or top) + thread (right or below); composer at bottom. | Messages, support tickets. |
| **Analytics** | Filters, date range, KPI cards, charts, table or export. | Revenue, portfolio, market. |

**Rule:** Each template has a defined structure; new pages pick the closest template and follow it.

---

## 15. Card system

### Listing cards

- **Image** — Top; aspect ratio 4:3 or 16:10; one image; optional badge (e.g. “New”, “Verified”).
- **Content** — Title, location, price (prominent), rating (if reviews), key meta (beds, guests).
- **Actions** — Save (icon), optional share; primary “View” or tap card.
- **Spacing** — Padding from scale; gap between image and content consistent.

### BNHub stay cards

- Same as listing cards; emphasize nightly price, dates if in context, and “Instant book” or “Request” badge.

### Deal cards

- **Image optional** — Or icon/illustration.
- **Content** — Title, location, type, short description; CTA “View deal” or “Express interest”.

### Analytics summary cards

- **Value** — Large number; optional trend (up/down + %).
- **Label** — Below value; secondary color.
- **Optional** — Small chart or icon; padding consistent with other cards.

### Profile cards

- **Avatar, name, role** — Optional verification badge; short bio or stats.
- **Use** — Host on listing; user in message; broker on listing.

### Notification cards

- **Icon, title, body, time** — Unread: bold or background tint; click to open target.

### Warning cards

- **Icon (warning), message, action** — Amber/warning style; e.g. payout hold, action required.

### Empty state cards

- **Illustration or icon, title, description, CTA** — Centered in container; friendly but clear.

**Hierarchy:** One primary action per card; secondary actions (e.g. save) in corner or on hover. **Spacing:** Use spacing scale; consistent across card types.

---

## 16. Button system

### Variants

- **Primary** — Main action (Submit, Book, Save); primary color background.
- **Secondary** — Secondary action (Cancel, Back); outline or secondary color.
- **Tertiary** — Low emphasis (Skip, See all); text or subtle background.
- **Ghost** — Minimal (icon buttons in toolbar); transparent until hover.
- **Destructive** — Delete, Remove; error color; use with confirmation.
- **Loading** — Spinner inside button; disabled state; same size to avoid layout shift.
- **Icon button** — Icon only; square or circle; tooltip for accessibility.

### Size variants

- **Small** — 32px height; compact areas.
- **Default** — 40px height; forms, cards.
- **Large** — 48px; primary CTA on mobile or hero.

### Priority rules

- One primary button per section or modal; others secondary or tertiary.
- Destructive always secondary (outline or ghost) with confirm modal.

### Disabled state

- Reduced opacity (e.g. 0.5); cursor not-allowed; no hover effect. Don’t rely on color alone.

### Mobile behavior

- Min height 44px for touch; full-width optional for primary CTA in forms.

---

## 17. Form system

### Field types and rules

- **Text / email / number** — Label above; placeholder optional; helper below; error below; border or ring on error.
- **Password** — Mask by default; show/hide toggle; strength indicator optional.
- **Currency** — Locale format; symbol or code; align right; allow decimals per currency.
- **Select** — Single or multi; label; dropdown or overlay; searchable if many options.
- **Date picker** — Calendar or input with validation; range for check-in/out; min/max clear.
- **Checkbox** — Label right or below; group for multiple; “Select all” when applicable.
- **Radio** — Group with legend; one selected; use for 2–5 options.
- **Toggle** — On/off; label and optional description; use for settings.
- **Textarea** — Resize vertical only or fixed rows; same label/error pattern.
- **File upload** — Drop zone or picker; list of files; progress; type/size validation message.

### Labels

- Always visible (no placeholder-only); above or left (above on mobile). Required indicator (* or “Required”).

### Helper text

- Below field; secondary color; short. Don’t repeat label.

### Placeholders

- Hint only (e.g. “e.g. Montreal”); not replacement for label.

### Inline validation

- On blur or after first submit; error below field; red border or ring.

### Error messaging

- One line per field; “Fix this” or “Enter a valid email”; link to field if summary at top.

### Success states

- Optional checkmark or “Saved” after submit; don’t overuse.

### Multi-step form behavior

- Step indicator at top; “Back” and “Next”/“Submit”; validate step before next; optional save draft.

---

## 18. Search and filter UI patterns

### Search bar

- **Desktop** — Full-width or constrained; icon left; clear button when filled; focus state clear.
- **Mobile** — Full-width or tap to expand; can open dedicated search screen.

### Autocomplete

- **Trigger** — On focus or after 2+ characters; debounce 200–300ms.
- **List** — Below input; keyboard nav; highlight on hover; “No results” message.
- **Selection** — Single select fills input; optional chips for multi.

### Filters sidebar

- **Sections** — By category (e.g. Price, Type, Amenities); checkboxes, range, or select.
- **Apply** — “Apply” button or live update; “Clear all” visible.
- **Mobile** — Sheet or bottom sheet; same sections; sticky “Show N results”.

### Chips / tags

- **Active filters** — Removable chips above results; “Clear all”.
- **Selected options** — In filter panel as chips or list.

### Sort controls

- **Dropdown** — “Sort by: Price”, “Relevance”; one selection; persist in URL.

### Map search UI

- **Map** — Bounds sync with results; markers; click marker to highlight in list.
- **List** — Scroll; highlight corresponding marker on hover/scroll (optional).
- **Toggle** — List/map view; same filters apply.

### Saved search patterns

- **List** — Name, query summary, “Run” or “Edit”; optional alert toggle.
- **Empty** — “Save this search” after results load; link in header or below results.

### Recent search patterns

- **Display** — Below search input on focus or on search page; last 5–10; tap to run.
- **Clear** — “Clear recent” option.

### Result count display

- “X results” or “Showing X–Y of Z”; update when filters change; near sort/filters.

**Marketplace vs BNHub:** Same patterns; BNHub adds date range and guests; marketplace adds property type and price range. One design system for both.

---

## 19. Marketplace listing detail patterns

### Photo gallery

- **Primary image** — Large; aspect ratio consistent; optional grid of 4–5 more.
- **Navigation** — Arrows or thumbnails; swipe on mobile.
- **Lightbox** — Click to open full-screen; same order.

### Key info summary

- **Title, location, rating** — Near top; price prominent (nightly or total for stay).
- **Meta** — Beds, baths, guests, property type; icons + text.

### Amenities

- **List** — Icons + labels; two columns on desktop; group by category if many.

### Rules

- **Check-in/out times, house rules** — Readable list or short paragraphs; expandable if long.

### Host / broker profile panel

- **Avatar, name, verification** — “Contact” or “Message” button; optional response time.
- **Sidebar** — Sticky on desktop; below gallery on mobile.

### Pricing summary

- **Before booking** — “From $X/night”; dates update estimate.
- **In sidebar** — Total, breakdown (nights, cleaning, fees); “Book” or “Request”.

### Calendar module

- **Availability** — Calendar; available/blocked; min nights; select check-in/out; total updates.

### Map section

- **Static or interactive** — General area (no exact address before booking); attribution.

### Trust indicators

- **Verified** — Badge on host and listing if applicable.
- **Reviews** — Count and average; link to review list.
- **Safety** — Short “Safety” or “Trust” note if policy.

### Inquiry / booking CTA area

- **Sticky** — On scroll; “Book now” (instant) or “Request to book”; price and dates summary.
- **One primary CTA** — No competing buttons.

**High-value decisions:** All information needed to commit (price, rules, availability, host) is visible or one click away; no hidden steps.

---

## 20. Booking and checkout design standards

### Date selection

- **Calendar** — Clear available/blocked; min/max nights; selection range; total nights and price update live.
- **Labels** — “Check-in”, “Check-out”; placeholders until selected.

### Guest count

- **Stepper or select** — Min 1; max from listing; extra guest fee shown if applicable.

### Price breakdown

- **Line items** — Nights × rate, cleaning fee, service fee, tax; total at bottom; always visible before payment.
- **Expandable** — Optional “See breakdown” if collapsed by default; never hide total.

### Taxes and fees visibility

- **Before payment** — “Taxes and fees” line or expanded section; amount or “Included”/“Calculated at checkout”.
- **Link** — To fee policy if needed.

### Payment step

- **Saved methods** — List; select one; “Add new” expands form.
- **Secure cues** — Lock icon, “Secure payment”; no collection of full card number in our UI (use provider).

### Confirmation step

- **Success** — Clear “Booking confirmed”; confirmation number; next steps (message host, add to calendar).
- **Failure** — Clear message; “Try again” or “Use another card”; support link.

### Cancellation rules visibility

- **On listing and checkout** — “Free cancellation until X”; or “Strict: no refund after Y”; short and readable.

### Refund / help access

- **Link** — “Cancellation policy”, “Need help?” near total or in footer; same in confirmation email.

**Principle:** Safe and transparent; user always knows what they’re paying and what happens if they cancel.

---

## 21. Dashboard design system

### KPI cards

- **Layout** — Value large; label below; optional trend; icon optional.
- **Grid** — 3–4 per row desktop; 2 then 1 on smaller screens.
- **Consistency** — Same card style across Host, Owner, Broker, Admin.

### Charts

- **Type** — Line for time series; bar for comparison; donut for composition; one chart library.
- **Colors** — From chart palette; legend when multiple series.
- **Axis** — Labels clear; no decorative 3D.

### Tables

- **Header** — Sortable where needed; sticky on scroll.
- **Rows** — Hover; row actions (icon or menu); status in badge.
- **Pagination** — Page size selector; prev/next; optional “Load more”.

### Filter bars

- **Placement** — Above table or below page title; inline filters or “Filters” button opening panel.
- **Apply** — “Apply” and “Clear”; show active count.

### Quick actions

- **Buttons** — “Add lead”, “New listing”; primary or secondary; near relevant section.

### Recent activity panels

- **List** — Time-ordered; icon, title, metadata; link to detail.
- **Empty** — “No recent activity” with short message.

### Alerts panels

- **Warning/info** — Banner or card at top; dismiss or action; e.g. payout hold, verification needed.

### Empty states

- **Illustration, title, description, CTA** — Same pattern as cards; role-specific copy.

### Loading states

- **Skeleton** — For cards and tables; match layout.
- **Spinner** — For button or local refresh.

### Role-specific patterns

- **Broker** — Leads board (kanban or table); client list; task list; same KPI and table patterns.
- **Owner** — Portfolio list; revenue chart; maintenance list; same cards and charts.
- **Host** — Listings, reservations, calendar, payouts; same components.
- **Admin** — Queues (listings, incidents, disputes); user/booking tables; audit log; denser but same system.
- **AI operations** — Fraud queue, moderation queue, risk panel; table + filters + action buttons; same tokens.

---

## 22. Data table system

### Table hierarchy

- **Header** — Background subtle (e.g. neutral.50); label + sort icon; alignment (text left, numbers right).
- **Rows** — Zebra optional; hover highlight; border or divider between rows.
- **Cells** — Padding from scale; truncate with tooltip if needed.

### Sortable columns

- **Icon** — Chevron or arrow; direction (asc/desc); clear state.

### Sticky headers

- **On scroll** — Header sticks; shadow when scrolled; same width as table.

### Row actions

- **Icon button** or **menu** — At row end; “View”, “Edit”, “Delete”; don’t overcrowd.

### Status badges

- **In cell** — Consistent badge component; color by status (e.g. green/yellow/red for status).

### Filters

- **Above table** or in sidebar; same filter components as search.

### Pagination

- **Page size** — 10, 20, 50; default 20.
- **Nav** — Prev, next, optional page numbers; “X–Y of Z”.

### Empty state

- **Message** — “No results”; “Adjust filters” or “Add first item”.
- **Illustration** — Optional.

### Mobile alternatives

- **Cards** — One card per row; key fields; tap for detail.
- **Horizontal scroll** — Only if few columns; first column sticky.
- **Rule** — Don’t force full table on small screens if readability suffers.

---

## 23. Status, badges, and indicators

### Verification badges

- **Icon** — Checkmark or shield; one style for “Verified” (identity/host).
- **Color** — Success/safety color; small; next to name or in header.
- **Text** — “Identity verified”, “Verified host”; tooltip or label.

### Booking status badges

- **Reserved** — Neutral or warning (pending).
- **Confirmed** — Success.
- **Cancelled** — Neutral or muted.
- **Completed** — Success or neutral.
- **Rule** — One color per status; consistent across app.

### Payment status badges

- **Pending, Succeeded, Failed, Refunded** — Same semantic colors (warning, success, error, neutral).

### Dispute status badges

- **Open, In progress, Resolved** — Same logic; resolved can be success or neutral.

### Review quality indicators

- **Stars** — 1–5; filled/empty consistent; optional half-star.
- **Average** — Number + “(X reviews)”; same on card and detail.

### Trust score visuals

- **If displayed** — Numeric or tier (e.g. High/Medium); color from semantic (green/amber/red); not alarming language.

### Incident severity labels

- **Low, Medium, High, Critical** — Color scale (neutral, warning, error); internal/admin; calm wording.

**Wording:** Use same terms as backend (e.g. “Confirmed” not “Approved” if API says confirmed). **Color:** Semantic only; don’t invent new meanings.

---

## 24. Messaging and notification patterns

### Conversation list

- **Avatar, name, last message preview, time** — Unread: bold or background tint.
- **Sort** — By last activity; unread optional filter.

### Chat thread

- **Bubbles or blocks** — Sender alignment (right/left); timestamp grouping; read state optional.
- **Composer** — Text area + send; attachment icon; submit on enter (shift+enter new line).

### Unread badges

- **Count** — Number on icon (nav); “99+” if high.
- **Dot** — If no count or for “has unread” only.

### Attachment handling

- **Preview** — Thumbnail or icon; name; size; remove.
- **Limit** — Max size and type in message; error if exceeded.

### Notification center

- **List** — Icon, title, body, time; mark read on click; “Mark all read”.
- **Grouping** — By type or time; optional.

### Push / email-linked actions

- **CTA in notification** — “View booking”, “Reply”; deep link to screen.

### Alert banners

- **Site-wide** — Top of page; severity color; message + dismiss or action; e.g. “Session expired. Please log in.”

### System notices

- **Informational** — Blue/info; short; dismissible; not for critical errors.

**Urgency:** Critical (banner, red) &gt; Warning (amber, banner or card) &gt; Info (blue) &gt; Success (green, toast). Don’t overuse high urgency.

---

## 25. Empty, loading, and error states

### Empty results state

- **Illustration or icon, title, description** — “No listings match your filters”; “Try adjusting filters” or “Clear filters”.
- **CTA** — “Clear filters”, “Browse all”.

### No bookings yet / no listings yet

- **Friendly but clear** — “You don’t have any trips yet”; “Start by searching for a stay”; primary CTA to search or create.

### Loading skeletons

- **Shape** — Match content (cards, lines); pulse animation; avoid generic spinner for full page.

### Loading spinners

- **Size** — Small in button; medium in block; don’t block whole page when only one section loads.
- **Placement** — Inline or center of container.

### Partial load states

- **Loaded content visible** — Skeleton or spinner for pending section; don’t hide entire page.

### Connection error states

- **Message** — “Something went wrong. Please check your connection and try again.”
- **Action** — “Retry” button; optional support link.

### Permission denied states

- **Message** — “You don’t have access to this page.”
- **Action** — “Go home” or “Contact support”.

### Retry patterns

- **Retry** button near error message; same action (e.g. refetch). Don’t auto-retry forever without user control.

**Tone:** Calm and helpful; explain what happened and what to do next; no blame.

---

## 26. Modal, drawer, and overlay patterns

### Confirmation modals

- **Title, body, actions** — “Cancel” (secondary) and “Confirm” (primary or destructive); focus on primary action.
- **Destructive** — Red primary for “Delete”; body explains consequence.

### Edit drawers

- **Side panel** — Slide from right; form inside; “Save” and “Cancel”; overlay behind.
- **Use** — Edit listing section, edit profile, filters.

### Action sheets

- **Mobile** — Bottom sheet; list of actions; “Cancel” at bottom; one tap to choose.
- **Use** — Share, report, more actions.

### Evidence upload modals

- **Title** — “Add evidence”; drop zone or picker; list of files; “Upload” and “Cancel”.
- **Progress** — Per file or overall.

### Quick-view panels

- **Drawer or modal** — Summary of listing/booking/deal; “View full” link; close without leaving page.

### Lightboxes for gallery images

- **Full screen** — Image; prev/next; close; optional caption.
- **Swipe** — On mobile.

**When to use:** Modal for critical confirmations and short forms; drawer for longer forms and filters; action sheet for 3+ actions on mobile. Always focus trap and escape to close.

---

## 27. Mobile design rules

### Touch target sizes

- **Minimum** — 44×44px for all tappable elements; buttons, links, icons.
- **Spacing** — Gap between targets so mis-taps are rare.

### Thumb zone logic

- **Primary actions** — In bottom half or center for one-handed use; FAB or sticky CTA at bottom.
- **Nav** — Bottom tab bar within thumb reach.

### Simplified navigation

- **Fewer tabs** — 3–5; combine or move secondary to profile/menu.
- **Back** — Clear back; stack or breadcrumb.

### Mobile booking steps

- **One column** — One question per screen or grouped; “Next” and “Back”; progress indicator.
- **Sticky total** — Price and “Continue” at bottom.

### Mobile dashboard behavior

- **Cards stack** — One column; KPI cards full width or 2-col; tables become cards or scroll.
- **Pull to refresh** — Optional on lists.

### Mobile forms

- **Full-width inputs** — Larger tap area; labels above; one column.
- **Keyboard** — Appropriate type (email, number); “Next” moves to next field; “Done” on last.

### Mobile table alternatives

- **Card per row** — Key fields; tap for detail.
- **Swipe actions** — Optional (e.g. delete); reveal on swipe.

### Mobile messaging

- **Full-screen thread** — Composer fixed at bottom; list as separate screen.
- **Notifications** — Push; in-app badge and list.

**Simplify:** Fewer columns, larger touch targets, sticky CTAs, and clear back/next; don’t hide primary actions.

---

## 28. Accessibility standards

### Contrast rules

- **Text** — 4.5:1 minimum for normal text; 3:1 for large text (e.g. 18px+ or 14px+ bold).
- **UI components** — 3:1 against adjacent background.
- **Focus** — Visible focus indicator with 3:1 or 2px outline.

### Keyboard navigation

- **All interactive** — Focusable; logical tab order; no trap except in modal (trap inside, close on Escape).
- **Skip link** — “Skip to main content” at top.

### Screen reader support

- **Semantic HTML** — Headings, lists, buttons, links; landmarks (nav, main, aside).
- **Labels** — All inputs have associated label; icons have aria-label or sr-only text.
- **Live regions** — For dynamic content (toasts, errors); aria-live polite or assertive.
- **State** — aria-expanded, aria-selected, aria-current where relevant.

### Accessible labels

- **Visible label** — Prefer visible; aria-label only for icon-only buttons.
- **Error** — Associate error with field (aria-describedby or aria-errormessage).

### Error accessibility

- **Announce** — Error message in live region or associated with field; focus to first error on submit.
- **Don’t rely on color** — Use text and icon; color is reinforcement.

### Focus states

- **Visible** — 2px outline or ring; offset 2px; never remove without replacement.
- **Order** — Match visual order; no focus jump unless intentional (e.g. open modal).

### Motion reduction

- **prefers-reduced-motion** — Respect; reduce or remove non-essential animation; keep essential feedback (e.g. loading).

**Target:** WCAG 2.1 AA; test with keyboard and one screen reader; fix issues before release.

---

## 29. Responsive design standards

### Breakpoints

- **Mobile** — 0–767px (or 0–639px if 3 breakpoints).
- **Tablet** — 768–1023px (or 640–1023px).
- **Desktop** — 1024px+ (or 1024–1279, 1280+).

Use same breakpoints across app; tokens or constants in code.

### Layout collapse behavior

- **Nav** — Horizontal top nav &gt; hamburger + drawer or bottom nav.
- **Sidebar** — Full &gt; icons only &gt; overlay on mobile.
- **Columns** — 3–4 &gt; 2 &gt; 1.

### Navigation changes

- **Desktop** — Full top + side nav.
- **Tablet** — Collapsed side or top only.
- **Mobile** — Bottom nav or hamburger; primary actions visible.

### Card stacking rules

- **Grid** — 4 &gt; 3 &gt; 2 &gt; 1 columns by breakpoint; gap constant or scaling.
- **Detail + sidebar** — Side by side &gt; stack (main first).

### Chart responsiveness

- **Redraw** — On resize; maintain aspect or full width.
- **Legend** — Below or right; wrap on small.
- **Touch** — Tooltip on tap; no hover-only.

### Form responsiveness

- **Single column** — On mobile; two columns only when width allows.
- **Buttons** — Full width on mobile optional for primary.

### Table responsiveness

- **Horizontal scroll** — With sticky first column; or switch to cards.
- **Hide columns** — Less important columns hidden on small; show in “View all” or detail.

### Media scaling

- **Images** — Responsive (srcset/sizes); aspect ratio preserved; lazy load below fold.

---

## 30. Trust & Safety visual language

### Verification visuals

- **Badge** — Single “Verified” style (checkmark or shield); green/success; next to name or in header.
- **Text** — “Identity verified”, “Verified host”; short and factual.

### Warning banners

- **Style** — Amber background or border; icon; message; action if needed.
- **Placement** — Top of relevant section (e.g. payout page); dismissible if not critical.
- **Tone** — “Your payout is on hold. Reason: [X]. [What to do].” Not “Warning!” alone.

### Policy notices

- **Block** — Neutral background; short text; link to full policy; near checkout or in footer.
- **Language** — Readable; avoid legalese in UI.

### Safety check indicators

- **Listing** — “Safety equipment: smoke alarm, first aid”; icon list; factual.
- **No drama** — No alarming imagery; calm and informative.

### Dispute banners

- **On booking** — “Dispute open” or “Refund requested”; status and link to detail.
- **Color** — Warning or neutral until resolved; success when resolved.

### Payout hold notices

- **Clear** — “Payout on hold”; reason; “Learn more” or “Contact support”; same style as warning banner.
- **Not error** — Amber, not red; “hold” not “blocked” if that’s accurate.

### Incident severity UI (internal)

- **Labels** — Low, Medium, High, Critical; color scale; for admin/support only.
- **Queue** — Sort by severity optional; don’t expose raw severity to consumer in alarming way.

### Fraud alert visuals (internal)

- **Admin** — Red or amber flag; “Review” action; list in queue; no consumer-facing scare language.

**Principle:** Communicate seriousness without causing panic; factual, calm, and actionable.

---

## 31. Analytics and chart design standards

### Line charts

- **Use** — Time series (revenue, bookings over time); one or few series; legend if multiple.
- **Axis** — Labeled; zero-based if meaningful; no 3D.

### Bar charts

- **Use** — Comparison (e.g. by region, by month); horizontal if long labels.
- **Spacing** — Gap between bars consistent.

### Area charts

- **Use** — Cumulative or volume over time; transparent fill; line on top.

### Donut charts

- **Use** — Composition (e.g. revenue by type); 2–6 segments; legend; avoid red/green only.
- **Center** — Optional total or label.

### Heat maps

- **Use** — Geo or matrix (e.g. day × hour); color scale explained; accessible (pattern or label).

### KPI summaries

- **Large number** — Tabular figures; trend up/down + %; label below.
- **Alignment** — Numbers right; labels left or below.

### Trend indicators

- **Up** — Green or primary; down — red or error; neutral — gray. Same as semantic colors.
- **Format** — “+X%”, “−X%”; optional arrow icon.

### Comparison cards

- **Before/after or A/B** — Side by side; same metric type; clear labels.

**Clarity:** Labels, legend, and axis must be readable; colors from palette; investor/owner/admin see same quality bar.

---

## 32. Content and microcopy principles

### Concise labels

- **Buttons** — “Save”, “Cancel”, “Book now”; avoid “Click here to save”.
- **Nav** — Short: “Trips”, “Messages”, “Payouts”.
- **Form** — Label = question or noun; “Email address”, “Check-in date”.

### Transparent pricing language

- **“Total”** — Not “Amount due” without breakdown.
- **“Service fee”** — Not “Fee”; “Cleaning fee” not “Other”.
- **“Included”** — When no extra cost; “Added at checkout” when applicable.

### Calm error messages

- **What happened** — “We couldn’t process your payment.”
- **What to do** — “Check your card details or try another card.”
- **No blame** — Avoid “You entered”; use “This field” or “Payment failed”.

### Trust-building confirmations

- **After book** — “You’re all set. Your host will receive your booking.”
- **After payout** — “Payout sent. It may take 1–3 business days.”

### Action-oriented button labels

- **Verb first** — “Save changes”, “Request refund”, “Contact host”.
- **Specific** — “Send message” not “Submit”.

### Dispute and safety wording

- **Factual** — “Open a dispute”, “Report an issue”; short and clear.
- **Support** — “We’ll review within 24 hours” or link to help; avoid “We’ll get back to you soon” without timeline if one exists.

### Empty state messaging

- **Friendly but clear** — “No trips yet” / “Your next adventure starts here” + CTA.
- **No guilt** — “Get started” not “You haven’t…”

### Support language tone

- **Help** — “Need help?”, “Contact support”; link to help center or form.
- **Consistent** — Same tone in app, email, and support UI.

**Principle:** The platform sounds calm, clear, and on the user’s side; no hype, no blame, no vagueness on money or safety.

---

## 33. Design tokens and systemization

### Color tokens

- **Semantic names** — `color.primary`, `color.text.primary`, `color.surface.raised`, `color.status.success`, etc.
- **Values** — Defined in one file (CSS variables or theme object); no hex in components.
- **Dark mode** — Same names; different values in dark theme.

### Spacing tokens

- **Scale** — `space.0` through `space.10` (e.g. 0, 4, 8, 16, 24, 32, 48, 64, 96px).
- **Usage** — Padding, margin, gap; components reference tokens only.

### Typography tokens

- **Font** — `font.family.primary`, `font.family.mono`.
- **Size** — `font.size.xs` through `font.size.3xl` (or scale names).
- **Weight** — `font.weight.regular`, `medium`, `semibold`, `bold`.
- **Line height** — `font.lineHeight.tight`, `normal`, `relaxed`.

### Radius tokens

- **Scale** — `radius.sm`, `radius.md`, `radius.lg`, `radius.full`.
- **Values** — 4, 8, 12, 9999px (or 6, 12, 16).

### Elevation tokens

- **Shadow** — `shadow.sm`, `shadow.md`, `shadow.lg`, `shadow.xl`.
- **Values** — One definition per level; consistent across app.

### Component tokens

- **Button** — `button.primary.bg`, `button.primary.text`, `button.height.md`.
- **Input** — `input.border`, `input.height`, `input.padding`.
- **Card** — `card.bg`, `card.padding`, `card.radius`, `card.shadow`.

### State tokens

- **Hover, focus, active, disabled** — Per component or global (e.g. `focus.ring`).
- **Overlay** — `overlay.scrim`, `overlay.opacity`.

**Engineering:** Tokens are the contract between design and code; implement in CSS variables or theme and reference in components. No magic numbers in UI code.

---

## 34. Component documentation standards

For each component, document:

| Section | Content |
|---------|--------|
| **Purpose** | When to use; when not to use. |
| **Variants** | Primary, secondary, sizes; with/without icon. |
| **States** | Default, hover, focus, active, disabled, loading, error. |
| **Usage rules** | One primary per section; do not use for X. |
| **Accessibility** | Keyboard, ARIA, contrast; required labels. |
| **Dos and don’ts** | 2–4 each; visual or text. |
| **Responsive notes** | Full width on mobile; min touch target; stacking. |

**Format:** Design tool (Figma/Sketch) + written doc or Storybook; designers and engineers share same source.

---

## 35. Cross-platform consistency rules

### What stays consistent

- **Visual identity** — Colors, typography, spacing scale, icon style, shadows, radius.
- **Component behavior** — Buttons, inputs, cards, modals: same variants and states.
- **Content tone** — Same microcopy and messaging rules.
- **Trust patterns** — Verification badges, pricing breakdown, error and empty states.
- **Accessibility** — Same contrast, focus, and keyboard/screen reader expectations.

### What adapts by platform

- **Navigation** — Web: top + sidebar; iOS/Android: bottom nav or drawer; same sections, different chrome.
- **Touch** — Larger targets and spacing on mobile; hover states optional on touch.
- **Inputs** — Native date picker or keyboard on mobile when better UX.
- **Modals** — Modal on web; bottom sheet or full screen on mobile when appropriate.
- **Density** — Admin can be denser (smaller padding, more rows); consumer stays spacious.

### Web

- Full layout; hover and focus; same tokens and components.

### iOS / Android

- Same tokens and components; platform nav patterns (e.g. tab bar); native gestures (swipe back) where expected.
- **iOS** — Safe area, large title optional; follow HIG for platform-specific patterns.
- **Android** — Material top app bar or custom; follow Material for system patterns.
- **Shared** — Booking flow, listing detail, messaging: same structure and content; layout adapts.

### Admin dashboards and internal tools

- Same design system; denser tables and filters; no consumer marketing flair; same trust and status patterns.

**Principle:** One system; platform and role adapt layout and density, not the core language.

---

## 36. Role-based experience styling

| Role | Tone and styling notes |
|------|-------------------------|
| **Guest** | Welcoming and simple; clear search and booking; trust (verification, reviews) visible; minimal friction. |
| **Host and owner** | Operational clarity; dashboards and tables legible; actions (approve, set price, block dates) obvious; warmth in messaging and empty states. |
| **Broker** | Professional workflow; CRM feels efficient (leads, clients, tasks); no playful elements; credibility (license, firm) visible. |
| **Investor** | Analytics seriousness; charts and numbers clear; deal and portfolio views feel data-driven; no casual copy. |
| **Admin and support** | Operational efficiency; queues and filters dense but organized; actions (suspend, resolve, refund) clear and auditable; same tokens, different density. |
| **AI operations** | Confidence and traceability; risk scores and queues clear; “Why” (explanation or audit) available; same tables and badges. |

**Differentiation:** Achieved by density, emphasis, and copy—not by different colors or new components. Same design system; role-appropriate content and layout.

---

## 37. Design QA and governance

### Component review process

- **New component** — Design in tool; spec with variants, states, tokens; review with design lead; handoff to engineering with doc.
- **Change** — Propose change; impact on existing usage; approve; update tokens or variants; communicate.

### Design QA standards

- **Before release** — Checklist: tokens used, contrast met, focus visible, copy per guidelines, responsive at breakpoints.
- **Sampling** — Key flows (book, payout, dispute) reviewed for trust and transparency.

### Release governance

- **Versions** — Design system version (e.g. 1.2); changelog (new components, changed tokens, deprecated).
- **Deprecation** — Announce; provide migration (e.g. old button → new button); remove after grace period.

### Documentation updates

- **When** — With every new component or token change.
- **Where** — Single source (Figma library, Storybook, or doc site); link from PRs.

### Design debt management

- **Track** — List of one-offs or inconsistencies; prioritize by impact.
- **Reduce** — Replace with system components and tokens in batches; avoid big-bang rewrites.

### Accessibility audits

- **Regular** — Automated (axe) in CI; manual (keyboard, screen reader) on critical flows.
- **Fix** — Bugs filed and prioritized; no ship without critical a11y fixes.

### Consistency checks

- **Visual** — Spot check new screens against templates and tokens.
- **Copy** — Review against microcopy guidelines; pricing and error messaging especially.

---

## 38. Final design system summary

### Purpose

The LECIPM UI/UX design system ensures **visual consistency, usability, accessibility, trust, and premium quality** across:

- Real estate marketplace, BNHub, Broker CRM, Owner dashboard, Deal marketplace, Investment analytics, Trust & Safety, AI Control Center, and mobile apps (iOS, Android, Web).

### How it supports trust

- **Transparency** — Pricing breakdowns, fees, and policies are visible; no hidden charges; cancellation and refund rules clear.
- **Verification** — Badges and status indicators are consistent and factual; safety and dispute entry points are easy to find.
- **Calm language** — Errors and holds are explained without blame or alarm; confirmations and support language build confidence.

### How it supports scalability

- **Tokens** — Color, spacing, type, radius, elevation live in one place; new surfaces use the same tokens.
- **Components** — Buttons, forms, cards, tables, and modals are specified once; reuse across roles and platforms.
- **Templates** — Page layouts (marketing, search, detail, dashboard, checkout, admin) are defined; new pages follow a template.

### How it supports premium quality

- **Typography and spacing** — Clear hierarchy and rhythm; readable and scannable.
- **Motion** — Purposeful and short; no distraction.
- **Accessibility** — Contrast, focus, keyboard, and screen reader built in; WCAG 2.1 AA target.
- **Content** — Concise, action-oriented, and consistent in tone.

### Cross-platform consistency

- **One visual language** — Same colors, type, and components on web and mobile.
- **Platform adaptation** — Navigation and density adapt (e.g. bottom nav, touch targets); core patterns and trust remain the same.
- **Role adaptation** — Guest, host, broker, owner, admin see the same system with role-appropriate content and layout density.

This blueprint is the single reference for the LECIPM design system. Product designers, frontend engineers, and AI coding tools should use it to build interfaces that are premium, trustworthy, transparent, and consistent across all products and user roles.

---

*References: [LECIPM Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [LECIPM API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [LECIPM Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md).*
