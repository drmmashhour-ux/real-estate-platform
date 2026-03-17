# LECIPM Platform — Frontend Architecture Blueprint

**Complete frontend architecture for the LECIPM ecosystem**

This document defines the frontend architecture for the LECIPM platform: user-facing applications, pages and screens, dashboards, shared UI systems, navigation, state management, component architecture, design system foundations, and responsive behavior across web and mobile. It supports product designers, frontend engineers, and AI coding tools in building the interface consistently. It aligns with the [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), and [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md).

---

## 1. Frontend architecture overview

### Purpose of the frontend architecture

The frontend architecture defines **how all user-facing surfaces are structured, built, and maintained** so that:

- **Consistency** — Same patterns, components, and behaviors across public site, authenticated app, dashboards, and mobile.
- **Clarity** — Clear mapping from user roles and modules to apps, routes, and screens.
- **Scalability** — New pages and features fit into a known structure without duplication or drift.
- **Collaboration** — Designers, frontend engineers, and tools share one source of truth for layouts, components, and flows.

### Frontend surfaces

| Surface | Description | Primary users |
|---------|-------------|----------------|
| **Public web platform** | Marketing site, help, legal, unauthenticated browsing of marketplace and BNHub. | Everyone |
| **Authenticated web app** | Single app (or unified shell) for logged-in users: marketplace, BNHub, profile, messages, bookings. | Guest, host, broker, owner, investor |
| **Admin panel** | Moderation, users, listings, bookings, payments, incidents, disputes, audit, compliance, feature flags. | Admin |
| **Broker dashboard** | CRM: leads, clients, listings, tasks, notes, communication. | Broker |
| **Owner dashboard** | Portfolio, revenue, maintenance, analytics, listing status. | Property owner (may overlap with host) |
| **Host dashboard** | BNHub: listings, calendar, bookings, payouts, performance, messages. | Host |
| **Guest booking experience** | Search → listing → checkout → trip management → review. | Guest |
| **iOS app** | Native or cross-platform (e.g. React Native) for guest, host, broker; same flows as web where applicable. | Guest, host, broker |
| **Android app** | Same as iOS; shared design and API contracts. | Guest, host, broker |

Guest, host, owner, and broker experiences can be **one authenticated app** with role-based navigation and route guards; admin and support are **separate apps** or **subdomains** (e.g. `admin.lecipm.com`) for security and clarity.

### Frontend goals

| Goal | Application |
|------|-------------|
| **Modular** | Features (BNHub, CRM, deals, etc.) are self-contained modules; shared components and layout live in a core layer. |
| **Scalable** | New routes and dashboards follow the same patterns; code-splitting and lazy loading keep bundles manageable. |
| **Responsive** | One design system with breakpoints; layouts and navigation adapt for desktop, tablet, and mobile. |
| **Accessible** | WCAG 2.1 AA target; keyboard, screen reader, contrast, focus, and form accessibility built in. |
| **Role-aware** | Menus, routes, and actions depend on user role; no dead links or actions the user cannot perform. |
| **Secure** | Protected routes, token handling, no sensitive data in client storage beyond what’s needed; session expiry handled in UX. |
| **Design-system-driven** | All UI built from a single design system (tokens, components, patterns); no one-off styles for core flows. |

---

## 2. User roles and frontend experiences

| Role | Main goals | Primary screens | Dashboard needs | Key actions |
|------|------------|-----------------|------------------|-------------|
| **Guest** | Find and book stays; manage trips; message hosts; leave reviews. | Search, listing detail, checkout, trips, messages, profile. | Trip list, upcoming/past, messaging. | Search, book, pay, cancel, message, review. |
| **Host** | Manage BNHub listings; handle requests; control calendar and pricing; get payouts; communicate with guests. | Host dashboard, listing edit, calendar, requests, reservations, payouts, messages. | Listings, bookings, earnings, calendar. | Create/edit listing, set availability, approve/decline, view payouts. |
| **Property owner** | View all properties (marketplace + BNHub); revenue and occupancy; maintenance; performance. | Owner dashboard, portfolio, revenue, maintenance, analytics. | Portfolio, revenue, maintenance, performance. | View reports, create maintenance request, manage listing status. |
| **Broker** | Manage leads and clients; manage listings; tasks and notes; communicate. | Broker dashboard, leads, clients, listings, tasks, notes, messages. | Leads board, clients, listings, tasks. | Add lead, update status, add note, contact client. |
| **Investor** | Discover deals; view analytics; track portfolio; communicate on deals. | Deals discovery, deal detail, analytics, portfolio, watchlist. | Deals, portfolio, analytics. | Browse deals, express interest, view forecasts. |
| **Admin** | Moderation, user/listings/bookings management, payments, incidents, disputes, audit, compliance, feature flags. | Admin home, users, listings, bookings, payments, incidents, disputes, audit, compliance, flags. | Queues (listings, incidents, disputes), metrics, audit. | Suspend user, remove listing, hold payout, resolve incident, view audit. |
| **Support agent** | Handle tickets; look up user/booking; process refunds; escalate. | Support inbox, ticket detail, user/booking lookup, refund tools, escalation. | Inbox, queues, macros. | Reply, resolve, refund, escalate. |

Roles can be combined (e.g. user is both host and broker); the UI shows the union of allowed entry points (e.g. Host + Broker nav) and guards actions by permission.

---

## 3. Application structure

### Main frontend applications

| Application | Scope | Entry URL (example) | Tech note |
|-------------|--------|---------------------|-----------|
| **Public marketing site** | Homepage, about, features, pricing, contact, help, trust & safety, legal, investor/partnership. | `www.lecipm.com` | Can be static or SSR; minimal auth. |
| **Public marketplace browsing app** | Search (properties, BNHub, deals), listing/deal detail, map search; no login required for browse. | `www.lecipm.com` or `app.lecipm.com` | Same domain or subdomain as app; shared header/footer. |
| **Authenticated platform app** | Post-login shell: marketplace, BNHub, profile, settings, messages, bookings, saved, verification. Role-specific: host tools, owner dashboard, broker CRM, deals/analytics. | `app.lecipm.com` | SPA or SSR; role-based nav and routes. |
| **BNHub booking interface** | Guest flow: search → detail → checkout → confirmation → trips → review. Can be part of platform app. | Same app, routes like `/stays`, `/bookings` | Shared components with host dashboard where relevant. |
| **Broker CRM dashboard** | Leads, clients, listings, tasks, notes, communication. | `app.lecipm.com/crm` or `broker.lecipm.com` | Role-gated; broker-only nav. |
| **Owner dashboard** | Portfolio, revenue, maintenance, analytics. | `app.lecipm.com/owner` | Role-gated; owner/host overlap. |
| **Admin governance platform** | Users, listings, bookings, payments, incidents, disputes, audit, compliance, flags. | `admin.lecipm.com` | Separate app or subdomain; admin-only. |
| **Mobile app experience** | iOS/Android: guest booking, host tools, broker essentials, messages, account. | Native apps + optional PWA | Same API; mobile-optimized layouts and nav. |

### How apps relate

- **Public site** and **marketplace browsing** can be the same codebase (e.g. Next.js) with public routes and optional auth.
- **Authenticated platform app** is the main app; it includes **BNHub guest flow**, **host dashboard**, **owner dashboard**, **broker CRM**, and **deals/analytics** via role-based routes and nav.
- **Admin** (and optionally **support**) are separate apps for security and tooling; they share design system and API client.
- **Mobile** reuses UX patterns and API; implementation can be native, React Native, or PWA with native shell.

---

## 4. Navigation architecture

### Top-level navigation (public)

- **Logo** → Home.
- **Links:** Marketplace, Stays (BNHub), Deals, About, Help, Pricing (if applicable).
- **CTA:** Sign in, Sign up (or Get started).
- **Search** entry (global): opens search overlay or navigates to search page with context (e.g. Stays vs Marketplace).

### Top-level navigation (authenticated)

- **Logo** → Home or dashboard home (role-based).
- **Primary:** Marketplace, Stays, Deals (role-dependent visibility).
- **Search** (same as public).
- **Messages** (icon + unread count).
- **Notifications** (icon + unread count).
- **Profile menu:** Profile, Trips / Hosting / Owner / CRM (by role), Account settings, Verification, Log out.

### Side navigation (dashboards)

- **Host:** Dashboard, Listings, Calendar, Reservations, Payouts, Messages, Performance, Incidents (if any).
- **Owner:** Dashboard, Portfolio, Revenue, Maintenance, Analytics, Payout history.
- **Broker:** Dashboard, Leads, Clients, Listings, Tasks, Notes, Messages, Settings.
- **Admin:** Dashboard, Users, Listings, Bookings, Payments, Incidents, Disputes, Payout holds, Audit logs, Compliance, Feature flags.
- **Support:** Inbox, Tickets, User lookup, Booking lookup, Macros.

Collapse to icons-only on narrow viewport; expand on hover or tap. Active item clearly indicated.

### Role-based menus

- **Guest only:** Trips, Saved, Profile, Settings. No Host/Owner/Broker nav.
- **Host:** Add Host dashboard, Listings, Calendar, Reservations, Payouts, Performance.
- **Owner:** Add Owner dashboard, Portfolio, Revenue, Maintenance.
- **Broker:** Add CRM (Leads, Clients, Listings, Tasks, Notes).
- **Investor:** Deals, Portfolio, Analytics.
- **Admin/Support:** Only in admin/support app; no consumer nav.

### Breadcrumbs

- Used in dashboards and multi-step flows: Home > Stays > [Listing name] > Checkout. Optional in flat list pages.

### Search entry points

- **Header:** Global search; choose context (Stays, Marketplace, Deals) or infer from current section.
- **Stays search:** Dedicated form (location, dates, guests) on Stays home and in header.
- **Marketplace search:** Location, type, price, bedrooms on Marketplace.
- **Deals:** Keyword/location on Deals discovery.

### Mobile bottom navigation

- **Guest:** Home, Search, Trips, Messages, Profile (5 items).
- **Host:** Home, Listings, Reservations, Messages, Profile (or Host center).
- **Broker:** Home, Leads, Messages, Profile.
- **Admin/Support:** Tab bar per app (e.g. Queue, Search, Audit, Settings).

### Contextual actions

- **Listing detail:** Book now, Save, Share, Contact host/broker.
- **Booking row:** View, Message host, Cancel, Leave review.
- **Lead row:** Mark status, Add note, Call/email.
- **Incident row:** View, Add evidence, (Admin) Assign, Resolve.

Navigation and route config are driven by role/permission so unauthorized routes are not rendered or are redirected.

---

## 5. Public website pages

| Page | Purpose | Main sections |
|------|---------|----------------|
| **Homepage** | Value proposition, hero, featured listings/stays/deals, trust indicators, CTAs. | Hero, Search (Stays/Marketplace), Features, Social proof, Footer. |
| **About** | Mission, team, story. | Narrative, Team, Values. |
| **Features** | Product capabilities by audience (guests, hosts, brokers, investors). | Tabs or sections per audience; links to app. |
| **Pricing** | Fees for guests/hosts, subscription for brokers if any. | Fee tables, calculator, FAQ. |
| **Contact** | General inquiries, support link. | Form, email/phone, help center link. |
| **Help center** | FAQs, categories, search. | Categories, articles, search, contact support. |
| **Trust and safety** | Verification, safety, policies. | Verification, Safety tips, Reporting, Policies. |
| **Legal pages** | Terms of service, Privacy policy, Cookie policy, Listing terms. | Text, TOC, last updated. |
| **Investor / partnership** | For investors and partners. | Overview, Contact, Optional login for deal flow. |

Each page uses the **public marketing layout** (header, footer, no sidebar). Legal and help can be static or CMS-backed.

---

## 6. Marketplace browsing pages

| Page | Purpose | Main UI sections |
|------|---------|------------------|
| **Property search results** | List marketplace listings with filters. | Filters sidebar, sort, result count, list/grid, map toggle, listing cards. |
| **BNHub stays search** | List short-term stays with date/guest filters. | Location + dates + guests bar, filters, sort, results, map. |
| **Deals search** | List deals. | Filters, sort, deal cards, keyword search. |
| **Map-based search** | Map view with markers; list alongside or in panel. | Map, cluster/markers, list panel, filters. |
| **Property detail (marketplace)** | Single property for sale/rent. | Gallery, title, price, details, description, amenities, map, broker/contact CTA, save, share. |
| **BNHub listing detail** | Single stay listing. | Gallery, title, price per night, dates/guests picker, description, amenities, rules, host, map, reviews, Book / Contact host. |
| **Deal detail** | Single deal. | Title, description, location, terms, documents, CTA (express interest, contact). |
| **Saved listings** | User’s saved properties/stays (auth). | Tabs (Stays / Marketplace / Deals), cards, remove. |
| **Compare listings** | Side-by-side comparison (optional). | Table or cards for 2–4 listings; key attributes. |

Search pages share **filtering, sort, pagination/infinite scroll, and empty state** patterns. Detail pages share **gallery, key info, CTA, and secondary actions**.

---

## 7. Authentication and account screens

| Screen | Purpose | Validation & UX |
|--------|---------|------------------|
| **Sign up** | Create account. | Email format, password strength, optional phone; inline validation; optional role (guest/host/broker); redirect after signup (e.g. verification or home). |
| **Login** | Sign in. | Email + password; “Remember me”; link to Forgot password; rate limit message after failures; redirect to returnUrl or dashboard. |
| **Forgot password** | Request reset. | Email; submit → “If an account exists…” message; link to login. |
| **Reset password** | Set new password from token. | Token in URL; new password + confirm; strength indicator; success → login or auto-login. |
| **Email verification** | Confirm email. | Link or code; success/expired state; resend option. |
| **Phone verification** | Confirm phone. | Request OTP → Enter code; resend countdown. |
| **Two-factor flow** | 2FA step after password. | Code input or TOTP; “Trust this device”; recovery codes link. |
| **Account recovery** | Recover locked/compromised account. | Identity check (email/phone), then reset or support path. |
| **Role onboarding selection** | Choose primary role(s) after signup. | Cards: Guest, Host, Broker, Investor; multi-select if allowed; saves and routes to relevant onboarding or home. |

All auth screens use a **centered card layout**, minimal chrome, and clear error messages (no “user exists” leakage). Session expiry can redirect to login with returnUrl.

---

## 8. User profile and settings screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Profile overview** | Public-facing profile summary. | Avatar, name, member since, verification badge, bio (if any); edit link. |
| **Personal information** | Edit name, bio. | Form; save/cancel. |
| **Contact details** | Email, phone. | Display + verified state; change email/phone flows (verify new). |
| **Verification center** | Status of identity/address/business verification. | Status per type, CTA to verify, link to help. |
| **Payment methods** | List and manage saved payment methods. | Cards (last4, brand); add, remove, set default. |
| **Notification settings** | Email, push, in-app by category. | Toggles per channel and category (bookings, messages, marketing, etc.). |
| **Privacy settings** | Visibility and data preferences. | Options per policy (e.g. profile visibility, analytics). |
| **Security settings** | Password change, 2FA. | Change password, enable/disable 2FA, recovery codes. |
| **Connected devices / sessions** | List active sessions. | Device, last active, current; revoke one or all. |

Settings use a **sidebar or tabs** for categories and a single main content area; forms have clear save feedback and validation.

---

## 9. BNHub guest experience screens

| Screen | Purpose | Main user actions |
|--------|---------|-------------------|
| **Stay search page** | Find stays. | Enter location, dates, guests; apply filters; view results and map. |
| **Listing detail page** | View stay and prepare to book. | Select dates/guests, see price, read rules and reviews, Book now or Contact host. |
| **Availability and calendar selector** | Choose dates. | Calendar with available/blocked; min/max nights; clear selection. |
| **Booking checkout page** | Review and confirm reservation. | See breakdown, guest details, special requests, policy; Continue to payment. |
| **Payment page** | Enter payment. | Payment method (saved or new), billing if needed; Pay; idempotent submit. |
| **Booking confirmation page** | Post-booking success. | Confirmation number, dates, listing, next steps (message host, add to calendar); link to trip. |
| **Trip management page** | List and manage trips. | Tabs: Upcoming / Past; card per trip; View, Message host, Cancel, Get directions. |
| **Messaging with host** | Conversation with host. | Thread view, send message, attachments; booking context shown. |
| **Refund request page** | Request refund. | Select booking, reason, amount (if partial); submit; status message. |
| **Review submission page** | Leave review after stay. | Rating, comment; submit; one per booking per side. |

Checkout is a **linear flow** (detail → checkout → payment → confirmation) with clear steps and no hidden fees; cancellation and refund policies visible before pay.

---

## 10. BNHub host screens

| Screen | Purpose | Host workflows |
|--------|---------|----------------|
| **Host dashboard home** | Overview. | Stats (views, bookings, earnings), recent requests, calendar preview, quick actions. |
| **Create listing flow** | Multi-step create. | Steps: Basics, Location, Photos, Amenities, Pricing, Availability, Rules, Review; save draft or publish. |
| **Edit listing screen** | Edit existing listing. | Same sections as create; status (draft/live), save, unpublish. |
| **Pricing management** | Set nightly, cleaning, etc. | Form; optional seasonal overrides; AI recommendation if available. |
| **Availability calendar** | Set available/blocked. | Calendar view, toggle dates, bulk block range; sync with bookings. |
| **Booking requests** | Requests to approve/decline. | List of pending; card with guest, dates, message; Approve / Decline with optional message. |
| **Reservations management** | All reservations. | Filters (upcoming/past); list; view detail, message guest, cancel (policy). |
| **Payout center** | Payouts and account. | Connected account status, payout history, held payouts, reports. |
| **Performance analytics** | Views, bookings, revenue. | Charts and KPIs; compare periods; link to listing. |
| **Guest communications** | Messages. | Conversation list; open thread; reply, attach. |
| **Incident reporting** | Report an issue. | Form: type, description, booking ref; attach evidence; submit. |

Host flows use the **dashboard layout** (side nav + main content). Create/edit listing can be multi-step wizard or long form with sections.

---

## 11. Real estate marketplace screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Property listing detail** | Single property (sale/rent). | Gallery, price, details, description, map, broker/agent, inquiry CTA. |
| **Search and filter experience** | Find properties. | Filters (location, type, price, beds), sort, results, map toggle. |
| **Inquiry form** | Contact about property. | Name, email, phone, message; submit; success state. |
| **Broker contact flow** | Contact broker (from listing or CRM). | Pre-filled listing; message; submit or open email. |
| **Saved properties** | Saved marketplace listings. | List; remove; link to listing. |
| **Property analytics snapshot** | Owner/broker view of performance. | Views, leads, optional comparables (if implemented). |
| **Offer / interest flow** | Express interest or offer (if applicable). | Form with terms; submit; confirmation. |

Marketplace and BNHub share **listing card** and **detail layout** patterns; marketplace omits booking calendar and uses inquiry/contact instead of Book.

---

## 12. Broker CRM screens

| Screen | Purpose | Primary broker workflows |
|--------|---------|---------------------------|
| **Broker dashboard home** | Overview. | Lead count, recent activity, tasks due, quick add lead. |
| **Leads board** | Manage leads. | List/board view; status columns; filter by source/status; add, edit, convert to client. |
| **Client records** | Contact database. | List; detail with contact info, linked leads/listings, notes; add/edit. |
| **Listing management** | Broker’s listings. | List (marketplace + BNHub if any); create, edit, status; link to leads. |
| **Tasks and reminders** | Task list. | Due date, related lead/client, status; create, complete, filter. |
| **Notes and follow-ups** | Notes on leads/clients. | Timeline or list per entity; add note; filter by date. |
| **Communication center** | Inbox for broker conversations. | Thread list; open thread; reply; link to lead/client. |
| **Broker analytics** | Performance. | Leads by source, conversion, listings performance (if data available). |
| **Settings and team management** | Broker profile, team. | Profile, license info, team members (if multi-user), notifications. |

CRM uses **dashboard layout** with side nav; leads can be **kanban** (by status) or **table**; detail pages use tabs (Info, Notes, Activity).

---

## 13. Owner dashboard screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Owner dashboard home** | Portfolio summary. | Total properties, revenue (period), occupancy, alerts; list of properties. |
| **Property portfolio** | All properties. | Cards or table; marketplace + BNHub; status, quick stats; link to detail. |
| **Revenue tracking** | Revenue over time. | Chart; filters (property, period); export. |
| **Maintenance requests** | List and create. | List by status; create request (property, type, description); track. |
| **Occupancy overview** | Occupancy by property/period. | Chart or table; BNHub focus. |
| **Performance analytics** | Deeper analytics. | Revenue, occupancy, comparisons; optional market benchmarks. |
| **Payout / transaction history** | Payouts and transactions. | List; filters; detail; export. |
| **Listing status management** | Draft/live/suspended. | Toggle or bulk actions; link to edit listing. |

Owner dashboard reuses **dashboard layout**; data can be read-only with links to host flow for editing BNHub listings.

---

## 14. Deal marketplace screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Deals discovery page** | Browse deals. | Search, filters, sort; deal cards; map optional. |
| **Deal detail page** | Single deal. | Title, description, terms, location, documents, participants (if allowed); CTA: express interest, contact. |
| **Investment analytics page** | Analytics for investor. | Portfolio metrics, market data, deal performance (if applicable). |
| **Deal documents page** | Documents for a deal. | List; view/download; upload (owner). |
| **Participant communication page** | Thread for deal. | Messages; attach docs; only participants. |
| **Watchlist** | Saved deals. | List; remove; link to deal. |
| **Portfolio overview** | Investor portfolio. | Deals participated in, performance snapshot. |

Deals use the same **card and detail** patterns as marketplace; express interest is a form or modal that creates a lead/interest record.

---

## 15. Investment analytics screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Market overview dashboard** | Region-level metrics. | Charts: price, occupancy, volume; region selector; period. |
| **Property valuation page** | Estimated value for a property. | Value range, methodology, date; owner-only for own listing. |
| **Portfolio performance dashboard** | User’s portfolio. | Aggregated revenue, occupancy, comparison to market. |
| **Market heat maps** | Geo visualization. | Map with intensity by metric (price, demand); filters. |
| **Forecast pages** | Demand/price forecasts. | Time series; region or listing; horizon selector. |
| **Investment opportunity recommendations** | AI or rule-based suggestions. | List of opportunities with rationale; link to listing/deal. |

Analytics use **dashboard layout** with charts (consistent chart library), filters, and optional export.

---

## 16. Trust & Safety screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Verification center** | User-facing verification status. | Identity, address, business (if broker); status; CTA to verify; help link. |
| **Incident reporting form** | Report incident. | Type, description, reported user/listing/booking; optional evidence upload; submit. |
| **Evidence upload flow** | Attach evidence to incident. | File picker; types/size limits; confirm; success. |
| **Dispute submission page** | Open dispute. | Booking/payment select; type; description; submit. |
| **Case tracking page** | User’s incidents/disputes. | List; status; view detail; add message/evidence. |
| **Trust status indicators** | Badges and labels. | Verified badge, host/guest badges; shown on profile and listing. |
| **Policy notice screens** | Policy content. | Cancellation, safety, community; readable text; link from footer and flows. |

Reporting and case tracking use **forms and lists**; evidence upload uses the **file upload** component; indicators are **badges** in header and cards.

---

## 17. AI Control Center screens

Admin or internal users only. Can live in admin app or dedicated AI dashboard.

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **AI overview dashboard** | Summary of AI systems. | Alerts count, moderation queue size, pricing coverage; links to queues. |
| **Fraud alerts queue** | List fraud alerts. | User/booking/listing ref, score, reason; drill to detail; actions (dismiss, escalate). |
| **Pricing recommendations panel** | Recommendations by listing. | List; listing, recommended price, range; link to listing; apply (optional). |
| **Moderation queue** | Content to moderate. | Listings, reviews, messages; reason; Approve / Remove / Escalate. |
| **Risk scoring panel** | Risk scores by user/listing. | Search; score, components; history. |
| **Support triage dashboard** | Tickets for triage. | Queue; assign, category, priority; link to ticket. |
| **Demand forecasting dashboard** | Forecasts by region. | Table or chart; region, horizon, metric; export. |
| **Explanation / audit logs view** | Why a decision was made. | Log per decision (e.g. risk score, moderation); timestamp, inputs, outcome. |

AI screens use **admin layout**, tables, and filters; actions are audited.

---

## 18. Admin governance screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Admin home dashboard** | Overview. | Counts (users, listings, bookings, incidents); recent activity; quick links. |
| **Users management** | List and manage users. | Search, filters (role, status); table; view detail, suspend, verify. |
| **Listings moderation** | Moderate listings. | Queue (pending, reported); view, approve, remove, request changes. |
| **Bookings review** | View bookings. | List; filters; detail; no edit unless support flow. |
| **Payments monitoring** | Payments and payouts. | List; filters; detail; link to booking/user. |
| **Incidents queue** | Incidents. | List by status; assign, add note, resolve; evidence. |
| **Disputes management** | Disputes. | List; assign; resolution (refund full/partial/none); document. |
| **Payout holds** | Held payouts. | List; reason; release or extend hold; audit. |
| **Audit logs** | Audit trail. | Filters (actor, resource, action, date); table; detail. |
| **Compliance dashboard** | Compliance metrics. | Reports, deadlines; links to reports. |
| **Feature flag management** | Toggle features. | List flags; toggle; rollout %; save. |

Admin uses **side nav + content**; list pages use tables with bulk actions where appropriate; all sensitive actions require confirmation and are audited.

---

## 19. Support agent screens

| Screen | Purpose | Main content |
|--------|---------|--------------|
| **Support inbox** | Ticket list. | Queue by status/priority; filters; unread; assign to self. |
| **Ticket detail page** | Single ticket. | Thread, user info, booking/payment ref; reply, attach; resolve, escalate. |
| **User profile lookup** | Find user. | Search by email/id; profile summary; link to bookings, incidents. |
| **Booking lookup** | Find booking. | Search by id/guest; booking detail; link to refund, dispute. |
| **Refund / dispute tools** | Process refund or dispute. | Select payment/booking; amount; reason; submit; confirmation. |
| **Escalation panel** | Escalate ticket. | Reason, assign to; submit. |
| **Macros / saved replies** | Quick replies. | List; insert into reply; edit (admin). |

Support uses the same **layout** as admin; ticket detail is **conversation view** with sidebar for user/booking context.

---

## 20. Mobile app architecture

### Guest mobile experience

- **Home:** Search bar, recent searches, featured stays.
- **Search:** Full-screen search (location, dates, guests); results list or map; filters in sheet or modal.
- **Listing detail:** Gallery (swipe), key info, sticky CTA (Book / Contact); calendar and price in accordion or sheet.
- **Checkout:** Stepper (dates → details → payment); minimal fields; Apple/Google Pay if available.
- **Trips:** List; tap → detail; message, cancel, directions.
- **Messages:** List; tap → thread; send; push for new messages.
- **Profile:** Menu to account, verification, payment methods, settings.

### Host mobile tools

- **Dashboard:** Summary; quick link to requests and calendar.
- **Requests:** List; approve/decline from card or detail.
- **Calendar:** Month view; tap to block; sync with web.
- **Reservations:** List; view, message guest.
- **Payouts:** View balance and history; connect account if needed.
- **Messages:** Same as guest.

### Broker mobile essentials

- **Leads:** List or board; quick status update; add note.
- **Clients:** List; view contact; call/email.
- **Messages:** Inbox; reply.
- **Tasks:** List; mark done.

### Push notifications

- **Guest:** Booking confirmed, reminder (check-in), message, review prompt.
- **Host:** New request, booking confirmed, message, payout sent.
- **Broker:** New lead, message.  
Deep link to relevant screen (e.g. booking, conversation).

### Mobile search, booking, messaging, account

- **Search:** Mobile-first: full-screen form, then results (list or map); filters in bottom sheet.
- **Booking:** Same flow as web but with larger touch targets and simplified steps; save payment for future.
- **Messaging:** List + thread; real-time or poll; attachments; notifications.
- **Account:** Profile, verification, payment methods, notifications, security, sessions; same as web, stacked screens or tabs.

### Mobile-first vs desktop-first

- **Mobile-first:** Guest search and booking, host requests and calendar, broker leads and messages, support inbox. These flows are designed for small screens first; desktop is enhanced layout.
- **Desktop-first:** Admin queues, analytics dashboards, complex tables, bulk actions, report builders. Optimized for large screens; mobile shows simplified or read-only views where needed.

---

## 21. Page layout system

| Layout | When used | Structure |
|--------|-----------|-----------|
| **Public marketing layout** | Homepage, about, features, pricing, contact, help, legal. | Header (logo, nav, CTAs), full-width content, footer. |
| **Marketplace browsing layout** | Search results, map search, listing/deal detail (public). | Header with search, optional sidebar filters, main content, footer. |
| **Dashboard layout** | Host, owner, broker, investor dashboards. | Top bar (logo, search, messages, notifications, profile), side nav, main content. |
| **Detail page layout** | Listing, deal, booking, user profile. | Header, breadcrumb (optional), main (gallery + details + sidebar or CTA), related/footer. |
| **Checkout layout** | Booking checkout, payment. | Minimal header or progress only, single column, no distraction; step indicator. |
| **Admin layout** | Admin and support. | Top bar (app name, user), side nav, main content; dense tables. |
| **Modal and drawer patterns** | Filters, quick view, confirmations, forms. | Modal: center, overlay. Drawer: side (filters, detail). Both: focus trap, escape to close. |

Layouts are implemented as **layout components** that wrap routes; which layout is used is determined by route/role.

---

## 22. Component architecture

### Component groups and reuse

All UI is built from **design system components**. Domain-specific components (e.g. listing card, booking card) compose primitives and stay in feature modules; they use the same tokens and patterns.

| Group | Examples | Reuse |
|-------|----------|--------|
| **Buttons** | Primary, secondary, ghost, danger; icon button; loading state. | Everywhere; one source. |
| **Inputs** | Text, email, number, password; with label, error, hint. | Forms. |
| **Selects** | Single, multi; searchable; with label. | Filters, forms. |
| **Date pickers** | Single, range; calendar; min/max. | Search, booking, availability. |
| **Price displays** | Formatted amount, currency; optional strike, breakdown. | Listing, booking, payouts. |
| **Cards** | Base card; listing card, booking card, deal card (composed). | Lists, dashboards. |
| **Listing cards** | Image, title, price, location, rating; variants for search vs detail. | Marketplace, BNHub, saved. |
| **Data tables** | Sortable, filterable; row actions; pagination. | Admin, CRM, reports. |
| **Tabs** | Horizontal; URL-synced or state. | Detail pages, settings. |
| **Accordions** | Expand/collapse sections. | FAQ, listing details. |
| **Modals** | Confirm, form, content; sizes. | Confirmations, quick edit. |
| **Toasts** | Success, error, info; auto-dismiss. | Feedback after actions. |
| **Badges** | Status, count, verification. | Nav, cards, profile. |
| **Avatars** | User image or initial; size variants. | Profile, messages, reviews. |
| **Calendars** | Month grid; select date or range; availability state. | Booking, host calendar. |
| **Maps** | Static or interactive; markers, cluster; attribution. | Listing, search. |
| **Charts** | Line, bar, pie; consistent lib (e.g. Recharts). | Analytics, dashboards. |
| **File uploaders** | Drag-drop or picker; progress; preview; type/size validation. | Listing photos, verification, evidence. |
| **Empty states** | Illustration or icon, message, CTA. | No results, no saved, no messages. |
| **Loading states** | Skeleton, spinner; per component or page. | Initial load, refresh. |
| **Error states** | Inline error, page error; retry, support link. | Forms, failed load. |

**Reuse strategy:** Primitives in `ui/` or design system package; composed components in `features/<domain>/components`; shared composed (e.g. ListingCard) in `shared/components`. No one-off styling for core flows.

---

## 23. Design system foundations

| Foundation | Rules |
|------------|--------|
| **Typography hierarchy** | H1–H6, body, caption, label; scale (e.g. 8px base); one or two font families (e.g. sans + mono for data). |
| **Spacing system** | 4/8px base scale (4, 8, 12, 16, 24, 32, 48, 64); used for padding, margin, gap. |
| **Grid system** | 12-column desktop; 8 or 4 for tablet/mobile; container max-width; consistent gutter. |
| **Color roles** | Primary, secondary, surface, background, border; semantic: success, warning, error, info; text primary/secondary/disabled. |
| **Elevation and surfaces** | Cards, modals, dropdowns; shadow scale (e.g. 0–3); consistent so hierarchy is clear. |
| **Iconography** | Single icon set (e.g. Heroicons, custom); size scale; semantic use (e.g. error icon red). |
| **Form standards** | Label above or floating; error below; required indicator; disabled state; consistent height and padding. |
| **Status colors** | Success green, warning amber, error red, info blue; used for badges, alerts, validation. |
| **Accessibility standards** | Contrast ≥4.5:1 (text), 3:1 (large text/icons); focus visible; touch target ≥44px; see §32. |

Consistency is maintained by **tokens** (CSS variables or theme object) and **component API**: no hard-coded colors or spacing in feature code; use tokens and components.

---

## 24. Responsive design strategy

| Breakpoint | Width | Layout behavior |
|------------|--------|------------------|
| **Desktop** | ≥1024px | Full side nav; multi-column; tables full; filters sidebar. |
| **Tablet** | 768–1023px | Collapsible side nav (icon or drawer); 2-column or stacked; tables scroll or card stack. |
| **Mobile** | &lt;768px | Bottom nav or hamburger; single column; cards stack; filters in sheet/modal; primary CTA sticky. |

- **Navigation:** Desktop: horizontal + side nav for dashboards. Mobile: bottom nav or drawer; top bar with menu.
- **Tables:** Desktop: full table. Mobile: card per row or horizontal scroll with sticky first column; avoid wide tables on small screens.
- **Card stacking:** List/grid becomes single column on small; 2-col tablet, 3–4 col desktop for listing grids.
- **Mobile-specific actions:** FAB for primary action; swipe actions on list items (e.g. delete); long-press for context menu where needed.

---

## 25. State management architecture

| State layer | What it holds | Where it lives | Global vs local |
|-------------|----------------|----------------|------------------|
| **Server state** | API data (listings, bookings, user, etc.). | Cache (e.g. React Query, SWR). | Cache is global per key; components subscribe by query key. |
| **Auth state** | User, token, roles, permissions. | Auth context or store; persisted (token in memory or secure storage). | Global. |
| **User session state** | Preferences, recent searches (optional). | Context or store; optional persistence. | Global or sessionStorage. |
| **UI state** | Modals open, sidebar collapsed, selected tab. | Local state or minimal global (e.g. sidebar). | Prefer local. |
| **Form state** | Current input values, errors, touched. | Form lib (React Hook Form, Formik) or local state. | Local to form. |
| **Filters state** | Search filters (location, dates, price). | URL query params + local state for transient; URL is source of truth for shareable. | URL + local sync. |
| **Cart / booking checkout state** | Selected listing, dates, guests, payment method. | Context or store for checkout flow; clear after success. | Scoped to checkout flow. |
| **Messaging state** | Current thread, unread counts. | Server cache + optional real-time; unread count in nav. | Cache global; current thread local or in route. |
| **Notifications state** | List, unread count. | Server cache; poll or push. | Global for count; list can be local to panel. |

**Guideline:** Prefer **server state in a cache** and **local state** for UI; use **global state** only for auth, checkout flow, and shared UI (e.g. sidebar). Avoid duplicating server data in a global store.

---

## 26. Frontend data fetching strategy

| Aspect | Approach |
|--------|----------|
| **API client** | Single client (axios/fetch wrapper); base URL, auth header from auth state, requestId, error mapping. |
| **Query caching** | Use React Query/SWR or similar: cache by key (e.g. `['bookings', userId]`); stale-while-revalidate. |
| **Optimistic updates** | For mutations (e.g. save, cancel): update cache optimistically; rollback on error; show toast. |
| **Pagination** | Cursor or page in API; infinite query or “Load more”; keep previous pages in cache or replace. |
| **Error retries** | Retry 5xx and 429 with backoff; do not retry 4xx (except 401 refresh token). |
| **Loading patterns** | Skeleton for initial load; spinner or inline for refresh; avoid full-page spinner for partial updates. |
| **Background refresh** | Refetch on window focus or interval for critical data (e.g. booking status); stale time per resource type. |
| **Secure token handling** | Token in memory (SPA) or httpOnly cookie; refresh before expiry; redirect to login on 401 after refresh fail; never log or expose token. |

---

## 27. Form and validation architecture

| Pattern | Use |
|---------|-----|
| **Validation** | Schema-based (Zod, Yup) or field-level; run on blur and submit; show error below field and in summary. |
| **Multi-step forms** | Wizard (listing create, checkout); step state; persist to server at step or at end; allow back without losing data. |
| **File upload** | Client validation (type, size); upload to presigned URL or API; progress; attach ref to form (id/url). |
| **Inline validation** | Validate on blur; optional on change for password strength; debounce for async (e.g. email exists). |
| **Error summaries** | At top of form for submit errors; link to field or scroll to first error. |
| **Save draft** | For long forms (listing); auto-save or “Save draft”; restore on return. |
| **Autosave** | For settings or simple forms; save after debounce; indicator “Saving” / “Saved”. |

---

## 28. Search UX architecture

| Element | Behavior |
|---------|----------|
| **Filters sidebar** | Desktop: sidebar; mobile: sheet or modal; clear all; apply or live update. |
| **Sort controls** | Dropdown or tabs (Price, Relevance, Newest); persist in URL. |
| **Map interactions** | Toggle list/map; map bounds sync with results; click marker → highlight in list and vice versa. |
| **Autocomplete** | Location search: suggest cities/regions; debounce; select updates search. |
| **Recent searches** | Store last N (localStorage or account); show on search focus or empty. |
| **Saved searches** | If logged in; list; run or edit; optional alert. |
| **Result count** | “X results” or “Showing X–Y of Z”; update with filters. |
| **Empty search state** | Illustration, “No results”; suggest broaden filters or clear; link to help. |

---

## 29. Booking and checkout UX

| Element | Behavior |
|---------|----------|
| **Availability selection** | Calendar with clear available/blocked; min/max nights; total nights and price update. |
| **Guest count** | Stepper or select; enforce max; update price if extra guest fee. |
| **Pricing breakdown** | Line items: nights × rate, cleaning fee, service fee, taxes; total prominent; no hidden fees. |
| **Fees and taxes** | Always visible before payment; explain each line (e.g. “Platform fee”). |
| **Payment entry** | Saved methods or new; use provider (Stripe) components; PCI: no raw card in our frontend. |
| **Confirmation states** | Success: confirmation number, next steps; failure: clear message, retry, support. |
| **Cancellation policy visibility** | Policy text and refund tiers (e.g. free until X days) on listing and checkout. |
| **Refund and dispute entry** | From trip detail: “Request refund” or “Open dispute”; clear flow and expectations. |

**Principle:** Full transparency; no hidden charges; policy and breakdown visible before payment.

---

## 30. Notifications and messaging UX

| Element | Behavior |
|---------|----------|
| **In-app notifications** | Bell icon; dropdown or panel; list with type icon, title, time; mark read; link to target (booking, message). |
| **Push notifications** | Request permission; register device; deep link to booking/message; respect notification preferences. |
| **Email-linked actions** | “View in app” link in email; open app or web to the right screen. |
| **Unread indicators** | Badge on bell and message icon; count or dot; clear when viewed. |
| **Conversation list** | Last message preview, avatar, unread; sort by last activity. |
| **Message composer** | Text area; send on submit or enter; optional attachment; loading state on send. |
| **Attachments** | Images/documents; preview; size limit; upload progress. |
| **System alerts** | Critical (e.g. account suspended): banner or modal; dismiss or action. |

---

## 31. Frontend security and access control

| Measure | Implementation |
|---------|-----------------|
| **Protected routes** | Auth guard: redirect unauthenticated users to login with returnUrl; role guard: redirect or 403 if role insufficient. |
| **Role-based rendering** | Nav and routes rendered per role; hide or disable links user cannot use. |
| **Permission-based actions** | Buttons/actions check permission (e.g. canCancelBooking); disable or hide if false; API enforces. |
| **Session expiration** | On 401: try refresh; on failure redirect to login; optional “Session expired” message. |
| **Secure file handling** | Upload via API; display via signed URL or proxy; no executable content; validate type/size. |
| **Anti-abuse UX** | Rate limit messaging in UI (e.g. “You can send again in X s”); captcha on sensitive forms if needed. |

---

## 32. Accessibility standards

| Area | Standard |
|------|----------|
| **Keyboard navigation** | All interactive elements focusable; logical tab order; no trap; skip link. |
| **Screen reader** | Semantic HTML; aria-label where needed; live regions for dynamic content (toasts, errors). |
| **Contrast** | Text ≥4.5:1, large text ≥3:1; UI components ≥3:1. |
| **Forms** | Label associated; errors associated; required indicated; clear instructions. |
| **Error messages** | Inline and summary; programmatically associated; suggest correction. |
| **Focus management** | Visible focus ring; focus trap in modals; focus restore on close; focus to first error on submit. |
| **Mobile** | Touch targets ≥44px; no hover-only actions; support zoom. |

Target **WCAG 2.1 AA**; test with keyboard and one screen reader (e.g. NVDA, VoiceOver).

---

## 33. Frontend performance strategy

| Technique | Use |
|-----------|-----|
| **Code splitting** | Route-based; lazy load dashboard, admin, BNHub create; reduce initial bundle. |
| **Lazy loading** | Heavy components (charts, map, rich editor) lazy; show skeleton or placeholder. |
| **Image optimization** | Responsive images; WebP/AVIF; lazy load below fold; CDN; correct size for layout. |
| **List virtualization** | Long lists (search results, messages, admin tables) virtualize (e.g. react-window). |
| **Caching** | API cache (React Query); static assets cache headers; optional service worker for offline. |
| **Skeleton loaders** | For lists and detail; reduce layout shift; match final layout. |
| **Bundle management** | Analyze bundle; tree-shake; shared chunks; avoid large deps in main bundle. |

---

## 34. Frontend folder / module organization

Suggested structure (e.g. Next.js or Vite + React):

```
src/
  app/                    # Routes, layouts, providers
    (public)/             # Public routes
    (auth)/               # Login, signup, forgot password
    (platform)/           # Authenticated app
      marketplace/
      stays/
      deals/
      host/
      owner/
      crm/
      account/
    (admin)/              # Admin app routes
  features/               # Feature modules
    auth/
    listing/
    booking/
    search/
    messaging/
    crm/
    admin/
    ...
  shared/
    components/           # Shared composed (ListingCard, etc.)
    hooks/
    utils/
    api/                  # API client, endpoints
    constants/
  ui/                     # Design system primitives
    Button, Input, Card, ...
  styles/
    tokens.css
    globals.css
  assets/
```

- **app:** Route segments and layout; minimal logic; compose features.
- **features:** Domain-specific components, hooks, and logic; one folder per domain; can depend on shared and ui.
- **shared:** Cross-feature components, API client, hooks, utils.
- **ui:** Design system components only; no feature logic.

Keep **modules isolated**: features do not import from other features directly; use shared or events/callbacks. This keeps refactors and code-splitting predictable.

---

## 35. Role-based dashboard mapping

| Role | Dashboards / sections | Entry points | Access control |
|------|------------------------|--------------|----------------|
| **Guest** | Trips, Saved, Profile | Nav: Trips, Saved, Profile menu | Authenticated only; own data. |
| **Host** | Host dashboard (listings, calendar, reservations, payouts, performance) | Nav: Hosting or Host center | Has host role; own listings/bookings. |
| **Owner** | Owner dashboard (portfolio, revenue, maintenance, analytics) | Nav: Owner dashboard | Has owner role (or host with ownership); own properties. |
| **Broker** | Broker CRM (leads, clients, listings, tasks, notes) | Nav: CRM or Broker | Has broker role; own leads/clients/listings. |
| **Investor** | Deals, Portfolio, Analytics | Nav: Deals, Portfolio | Authenticated; deals public or by participation. |
| **Admin** | Admin app (users, listings, bookings, payments, incidents, disputes, audit, flags) | Subdomain or path; admin login | Admin role only; all data in scope. |
| **Support** | Support app (inbox, tickets, lookup, refund, macros) | Separate app or admin area | Support role; limited write vs admin. |

**Navigation entry:** After login, redirect by role (e.g. host → host dashboard; broker → CRM) or to a home that shows cards per available dashboard. **Access control:** Route guard checks role/permission; API enforces; 403 or redirect if missing.

---

## 36. Frontend development priorities

Suggested order to build the frontend:

1. **Public site** — Homepage, about, help, legal; marketing layout and design system baseline.
2. **Authentication** — Sign up, login, forgot/reset password, verification; auth state and protected route guard.
3. **Marketplace search and listing pages** — Search (properties, BNHub, deals), filters, listing/deal detail; shared listing card and detail layout.
4. **BNHub booking flow** — Guest: search → detail → checkout → payment → confirmation; trips list and detail.
5. **Host tools** — Host dashboard, create/edit listing, calendar, requests, reservations, payouts.
6. **Broker CRM basics** — Dashboard, leads, clients, listing management, tasks, notes.
7. **Owner dashboard basics** — Portfolio, revenue, maintenance, payout history.
8. **Admin moderation tools** — Users, listings, incidents, disputes, audit logs.
9. **Advanced analytics and AI screens** — Market analytics, portfolio, AI queues, risk and moderation (admin).

Messaging, notifications, and support can be phased in after core flows are stable. Mobile can follow web or in parallel using the same API and design tokens.

---

## 37. Testing strategy for frontend

| Type | Scope | Tools / approach |
|------|--------|-------------------|
| **Component testing** | Primitives and composed components; props, events, a11y. | React Testing Library; Jest or Vitest; axe-core. |
| **Page testing** | Key pages: render, critical interactions, no crash. | RTL + router mock; happy path only. |
| **End-to-end flows** | Login, search, book, host approve, payout. | Playwright or Cypress; against staging API; critical paths. |
| **Accessibility testing** | Automated a11y rules; keyboard; screen reader spot checks. | axe-core in unit/E2E; manual NVDA/VoiceOver. |
| **Visual regression** | Design system and key screens. | Percy, Chromatic, or screenshot diff; on tokens and main pages. |
| **Mobile responsiveness** | Breakpoints and touch. | E2E in mobile viewport; manual device testing. |

---

## 38. Final frontend blueprint summary

### Frontend surfaces

- **Public:** Marketing site + marketplace/BNHub/deals browsing (no login).
- **Authenticated platform app:** Marketplace, BNHub, profile, messages, bookings; role-based: host dashboard, owner dashboard, broker CRM, deals/analytics.
- **Admin:** Separate app for users, listings, bookings, payments, incidents, disputes, audit, compliance, feature flags.
- **Support:** Inbox, tickets, lookup, refund, macros.
- **Mobile:** Guest, host, broker flows; same API and design system; mobile-first for search, booking, messaging.

### Design and structure

- **One design system:** Tokens (typography, spacing, color, elevation), primitives (buttons, inputs, cards, etc.), and patterns (layouts, forms, search, checkout).
- **Modular apps:** Public, platform, admin, support; platform app is role-aware with one shell and multiple dashboards.
- **Navigation:** Top-level + role-based menus; side nav for dashboards; bottom nav on mobile; search and contextual actions consistent.
- **State and data:** Server state in cache; auth global; UI and form state local; filters in URL where shareable.

### Coverage by module

| Module | Frontend coverage |
|--------|-------------------|
| Real estate marketplace | Public + auth browsing; property search, detail, inquiry; saved; broker contact. |
| BNHub | Guest: search, detail, checkout, trips, messages, reviews. Host: dashboard, listing, calendar, requests, payouts, performance. |
| Broker CRM | Leads, clients, listings, tasks, notes, messages, settings. |
| Owner dashboard | Portfolio, revenue, maintenance, analytics, payouts. |
| Deal marketplace | Deals discovery, detail, watchlist, express interest, documents, messages. |
| Investment analytics | Market, valuation, portfolio, forecasts, recommendations. |
| Trust & Safety | Verification center, incident/dispute reporting, case tracking, policy notices. |
| AI Control Center | Admin/internal: fraud, moderation, pricing, risk, triage, forecasts, audit. |
| Admin & support | Full admin and support screens as above. |

This blueprint is the single reference for designing and implementing the LECIPM frontend so that product designers, frontend engineers, and AI coding tools build a consistent, scalable, and accessible experience across web and mobile for all user roles.

---

*References: [LECIPM Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [LECIPM Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [LECIPM Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md).*
