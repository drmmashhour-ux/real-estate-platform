# LECIPM Platform — Design-to-Code Implementation Guide

**Practical guide for converting the design system and page architecture into reusable frontend code**

This document explains how to implement the LECIPM UI/UX design system and frontend architecture as maintainable, scalable frontend code. It is for frontend engineers and AI coding tools that translate designs into components, layouts, and features. It aligns with the [Design System Blueprint](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), and [API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md). Use this guide to build components consistently, integrate with APIs, and keep the codebase modular and testable.

---

## 1. Implementation philosophy

### Principles for converting designs into code

| Principle | Application |
|-----------|-------------|
| **Component-first development** | Build UI as small, single-responsibility components; compose them into pages. Every screen is a tree of components, not one-off markup. |
| **Reusable UI primitives** | Buttons, inputs, cards, and typography live in a shared layer (`ui/`). Feature components (e.g. ListingCard) use only these primitives and tokens—no inline styles or one-off classes for core patterns. |
| **Separation of layout and logic** | Layout components (Container, Grid, PageLayout) handle structure and responsiveness; they do not contain business logic or API calls. Data fetching and state live in hooks, containers, or page-level code. |
| **Scalable folder organization** | Clear boundaries: `ui/` for design system, `shared/` for cross-feature components and API, `features/` for domain-specific UI and logic. Features do not import from other features; they depend on shared and ui. |
| **Accessibility compliance** | Every component meets WCAG 2.1 AA where applicable: semantic HTML, labels, focus states, keyboard support. Accessibility is part of the component contract, not an afterthought. |
| **Consistent design token usage** | No magic numbers or hard-coded colors in components. All spacing, color, typography, and radius come from design tokens (CSS variables or theme object). Changing a token updates the whole app. |

### Outcomes

- **Single source of truth** — Design tokens and primitives are implemented once; pages and features reuse them.
- **Predictable structure** — New engineers and tools know where to add components and how to compose them.
- **Easier testing** — Small components can be unit-tested; integration tests target composed flows.
- **Maintainability** — Design changes propagate via tokens and primitives; less duplicated style logic.

---

## 2. Frontend technology layer

### Recommended stack (guidance)

The following is a recommended baseline; teams can substitute equivalents that satisfy the same constraints.

| Layer | Recommendation | Rationale |
|-------|-----------------|------------|
| **Component framework** | React 18+ (or equivalent component model) | Component composition, hooks, broad ecosystem; aligns with design-system thinking. |
| **State management** | React Query (or SWR) for server state; Context or Zustand for auth/UI | Server state is cached and deduplicated; minimal global client state. |
| **Routing** | React Router or framework router (Next.js, Remix) | Nested routes for app/dashboard structure; route guards for auth and roles. |
| **API client** | Fetch wrapper or axios with interceptors | Centralized base URL, auth header, error mapping, requestId; no ad-hoc fetch in components. |
| **Styling** | CSS-in-JS (e.g. styled-components, Emotion) or CSS Modules + CSS variables | Tokens as variables; scoped styles; no global class conflicts. Tailwind is acceptable if tokens are configured in config (theme extension). |
| **Design token integration** | CSS custom properties (variables) or JS theme object imported by styling solution | Tokens defined in one file (e.g. `tokens.css` or `theme.ts`); components reference token names only. |

### How these support scalable development

- **React + components** — Clear boundaries; easy to lazy-load by route or feature.
- **React Query** — Caching, loading/error states, refetch, and pagination patterns out of the box; less custom server-state code.
- **Router** — Layouts per route segment; auth and role guards in one place.
- **API client** — One place to add logging, retries, and token refresh; components call hooks that use the client.
- **Tokens in CSS/theme** — Theming and dark mode by swapping token values; no component changes.
- **Consistent stack** — Onboarding and AI tools can assume this structure; documentation and examples stay relevant.

### Framework alternatives

- **Next.js / Remix** — Use for SSR, static generation, or file-based routing if the team prefers; same component and token approach applies.
- **Vue / Svelte** — Same principles: tokens, primitives, feature modules, server-state library; adjust syntax and patterns to the framework.

---

## 3. Design tokens implementation

### How visual tokens become code variables

Design tokens are implemented as **named variables** that components reference. Prefer **CSS custom properties** so that themes (e.g. dark mode) can override values without recompiling components.

### Token categories and examples

**Colors**

```css
/* tokens.css or :root */
--color-primary: #0d47a1;
--color-primary-hover: #1565c0;
--color-text-primary: #1a1a1a;
--color-text-secondary: #666666;
--color-surface-raised: #ffffff;
--color-background: #f5f5f5;
--color-border: #e0e0e0;
--color-status-success: #2e7d32;
--color-status-warning: #ed6c02;
--color-status-error: #d32f2f;
```

**Spacing** (4px base scale)

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;
--space-10: 64px;
```

**Typography**

```css
--font-family-primary: 'Inter', system-ui, sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--line-height-tight: 1.25;
--line-height-normal: 1.5;
```

**Border radius**

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

**Shadows**

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

**Motion**

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--ease-default: ease;
```

### Using tokens in components

- **CSS:** Use `var(--token-name)` for every visual property (color, margin, padding, font-size, border-radius, box-shadow).
- **No hard-coded values** in component styles for things that belong in the design system; if a value is repeated or matches a scale, it should be a token.
- **Theme switch:** For dark mode, define a `[data-theme="dark"]` or `.theme-dark` scope and override the same variable names (e.g. `--color-background`, `--color-text-primary`).

### Consistency rule

- New components must not introduce new spacing or color values; they use the token set. If a new need arises, add a token and document it, then use it everywhere it applies.

---

## 4. Core UI component library

The base layer lives under `ui/` (or `components/ui/`). Each component is documented with props, states, and accessibility requirements.

### Button

- **Props:** `variant` (primary | secondary | tertiary | ghost | destructive), `size` (sm | md | lg), `disabled`, `loading`, `fullWidth`, `leftIcon`, `rightIcon`, `children`, `type`, `onClick`, and standard HTML button attributes.
- **States:** Default, hover, focus (visible ring), active (pressed), disabled (opacity + cursor), loading (spinner + disabled).
- **Styling:** Background, text, and border from tokens per variant; height from spacing scale (e.g. 32/40/48px); padding horizontal from scale.
- **Accessibility:** Native `<button>` or `role="button"` with `tabIndex={0}`; `aria-busy` and `aria-disabled` when loading/disabled; focus ring from tokens.

### Input (text, email, number, password)

- **Props:** `label`, `helperText`, `error`, `disabled`, `required`, `placeholder`, `leftAddon`, `rightAddon`, and standard input attributes.
- **States:** Default, focus (border/ring), error (border + error message), disabled.
- **Styling:** Height from token (e.g. 40px); padding from scale; border and border-radius from tokens; error state uses `--color-status-error`.
- **Accessibility:** `<label>` associated with `<input id>`; `aria-invalid` and `aria-describedby` for error/helper; error message linked and announced.

### Select

- **Props:** `label`, `options` (array of { value, label }), `placeholder`, `value`, `onChange`, `disabled`, `error`, `helperText`, `multiple` (optional).
- **States:** Same as Input; open state for dropdown.
- **Implementation:** Native `<select>` styled, or custom dropdown with `role="listbox"`, `aria-expanded`, `aria-activedescendant`; keyboard (Arrow, Enter, Escape).
- **Accessibility:** Label, focus, keyboard nav, screen reader announcement of selected value.

### Checkbox

- **Props:** `checked`, `indeterminate`, `disabled`, `label`, `helperText`, `onChange`.
- **Styling:** Size from token (e.g. 20px); border and check color from tokens.
- **Accessibility:** Native `<input type="checkbox">` with visible `<label>`; `aria-checked` for indeterminate.

### Radio

- **Props:** `name`, `options` (array of { value, label }), `value`, `onChange`, `disabled`.
- **Accessibility:** Fieldset + legend; native radio inputs or custom with `role="radiogroup"` and `role="radio"`.

### Toggle

- **Props:** `checked`, `onChange`, `disabled`, `label`, `helperText`.
- **Accessibility:** `role="switch"`, `aria-checked`; keyboard toggle with Space.

### Textarea

- **Props:** Same as Input; `rows`, `resize` (vertical | none).
- **Same patterns** for label, error, helper, and accessibility as Input.

### DatePicker

- **Props:** `value`, `onChange`, `min`, `max`, `range` (start/end), `disabled`, `label`, `error`.
- **Implementation:** Input that opens calendar overlay; calendar uses table with `role="grid"`, `aria-label` for month/year; keyboard nav (Arrow, Enter).
- **Accessibility:** Focus trap in open state; Escape closes; label and error associated.

### FileUploader

- **Props:** `accept`, `maxSize`, `multiple`, `onChange` (files or urls), `value` (current files), `disabled`.
- **UI:** Drop zone (border dashed) + file list with name, size, remove; progress optional.
- **Accessibility:** Label; `aria-describedby` for limits; drag-and-drop is enhancement; must work with file input.

### Shared rules for all primitives

- **Ref forwarding** — Support ref for focus management and form libraries.
- **ClassName / style** — Allow optional `className` or `sx` for one-off overrides without breaking token usage.
- **Id** — Auto-generate id for label/input association if not provided (use React `useId` or equivalent).
- **Document** — Each component has a short doc: purpose, props, states, and a11y notes.

---

## 5. Layout components

Layout components live in `ui/layout/` or `shared/components/layout/`. They are structure-only; no business logic or API calls.

### PageLayout

- **Props:** `header`, `children`, `footer`; or slots for top/main/bottom.
- **Structure:** Vertical stack: header (optional), main (flex-grow), footer (optional). Main has max-width container and padding from tokens.
- **Responsive:** Padding and max-width can change by breakpoint via media queries or responsive props.

### DashboardLayout

- **Props:** `sidebar` (node or menu config), `topBar`, `children`.
- **Structure:** Top bar (fixed or sticky) + flex row: sidebar (fixed width or collapsible) + main content. Main scrolls independently.
- **Responsive:** Sidebar collapses to icons or drawer on small screens; top bar remains.

### Container

- **Props:** `maxWidth` (narrow | default | wide | full), `padding`, `children`.
- **Renders:** Div with max-width and horizontal padding from tokens; centers with margin auto.
- **Use:** Wrap page content and forms to constrain width.

### Grid

- **Props:** `columns` (1–12 or responsive object), `gap`, `children`.
- **Renders:** CSS Grid or flex with gap from tokens; column count from props or breakpoints.
- **Use:** Listing grids, card rows, form rows.

### Stack

- **Props:** `direction` (row | column), `gap`, `align`, `justify`, `children`.
- **Renders:** Flex with gap; used for vertical or horizontal grouping without full grid.
- **Use:** Button groups, form fields, list headers.

### Sidebar

- **Props:** `collapsible`, `defaultOpen`, `width`, `children` (nav items).
- **Structure:** Fixed or sticky column; nav items as list; active state from route or prop.
- **Responsive:** Below breakpoint: overlay or drawer; toggle button in top bar.

### Header

- **Props:** `logo`, `nav`, `actions` (search, messages, profile), `sticky`.
- **Structure:** Flex row; logo left, nav center/left, actions right; height from token (e.g. 56–64px).
- **Responsive:** Nav collapses to menu; actions remain or move to menu.

### Footer

- **Props:** `links` (grouped), `copyright`, `legal` (terms, privacy).
- **Structure:** Multi-column or stacked; spacing from tokens; used on marketing and app pages.

### Composition

- Pages compose these layouts: e.g. `PageLayout` with `Header` and `Footer`; or `DashboardLayout` with `Sidebar` and main content that uses `Container` and `Grid` inside. Layout components do not fetch data; they receive content as props or children.

---

## 6. Marketplace components

These live in `shared/components/` or `features/marketplace/components/`. They compose UI primitives and tokens.

### ListingCard

- **Props:** `id`, `title`, `subtitle` (location), `imageUrl`, `imageAlt`, `price` (formatted string or amount + currency), `rating`, `reviewCount`, `meta` (beds, baths, guests), `badge` (e.g. "Instant book"), `href` or `onClick`, `onSave`, `saved`.
- **Structure:** Card (ui) with image on top (aspect-ratio from tokens), then content block: title, subtitle, meta row, price, rating; actions: save icon, optional share. Entire card or title can be link.
- **Use:** Search results (property, BNHub, deals); saved list. Compose with `PriceDisplay`, optional `VerificationBadge`.

### ListingGallery

- **Props:** `images` (array of { url, alt }), `aspectRatio`, `showThumbnails`.
- **Structure:** Main image + optional thumbnails or dots; lightbox on click (modal with image and nav). Swipe on touch.
- **Use:** Listing detail page; same component for property and BNHub.

### PriceDisplay

- **Props:** `amount` (number in cents), `currency`, `period` (e.g. "night", "month"), `size` (sm | md | lg), `strikeThrough`, `breakdown` (optional line items).
- **Renders:** Formatted amount (locale, currency symbol); period in smaller text; breakdown as list if provided.
- **Use:** Cards, sidebar, checkout; always use same formatting (no raw numbers).

### AmenitiesList

- **Props:** `amenities` (array of { key, label } or strings), `columns` (1 | 2), `iconMap` (key → icon component).
- **Renders:** Grid of icon + label; tokens for gap and icon size.
- **Use:** Listing detail; BNHub and marketplace.

### HostCard

- **Props:** `name`, `avatarUrl`, `verified`, `responseTime`, `memberSince`, `onContact`.
- **Structure:** Avatar + text block + primary button "Contact" or "Message". Verification badge from Trust & Safety component.
- **Use:** Listing detail sidebar; messaging context.

### LocationMap

- **Props:** `lat`, `lng`, `zoom`, `static` (image URL) or `interactive` (map lib), `markerTitle`.
- **Implementation:** Static image or embed (e.g. Mapbox, Google Maps); ensure attribution and privacy (no exact address before booking if required by policy).
- **Use:** Listing detail; search map view.

### FilterPanel

- **Props:** `sections` (array of { title, children }), `onApply`, `onClear`, `activeCount`.
- **Structure:** Accordion or stacked sections; each section uses Select, Checkbox group, or range inputs from UI primitives. Buttons: "Clear all", "Apply" (or live update).
- **Responsive:** Desktop: sidebar; mobile: sheet or modal opened by "Filters" button.
- **Use:** Search results page (property, BNHub, deals).

### SearchBar

- **Props:** `value`, `onChange`, `onSubmit`, `placeholder`, `context` (stays | marketplace | deals), `suggestions` (for autocomplete), `recentSearches`.
- **Structure:** Input with search icon; on focus or type show suggestions or recent list (dropdown); submit on Enter or button.
- **Use:** Global header; search page. Compose with same Input primitive.

### Composition for marketplace pages

- **Search results:** `PageLayout` > `Header` (with `SearchBar`) > `Container` > `Grid` (sidebar `FilterPanel` + main) > sort bar + result count + list of `ListingCard` (or `DealCard`).
- **Listing detail:** `PageLayout` > `Header` > `Container` > two-column layout: main = `ListingGallery` + sections (description, `AmenitiesList`, rules, map) + reviews; sidebar = key info + `PriceDisplay` + calendar + `HostCard` + CTA. Compose from layout and marketplace components; data from hooks/API.

---

## 7. Booking components

BNHub booking components compose primitives and shared components; they live in `features/booking/components/` or `shared/components/booking/`.

### CalendarSelector

- **Props:** `value` (date or range), `onChange`, `minDate`, `maxDate`, `availableDates` or `blockedDates`, `minNights`, `maxNights`, `locale`.
- **Structure:** Calendar grid (table or div grid); available dates clickable; blocked disabled; range selection highlights; min/max nights enforced in onChange.
- **Accessibility:** `role="grid"`, month/year label; arrow keys to move; Enter to select.
- **Use:** Listing detail and checkout; host calendar.

### GuestCounter

- **Props:** `min`, `max`, `value`, `onChange`, `label`, `extraGuestFee` (optional, for display).
- **Structure:** Stepper (minus/plus) or number input; display extra fee when above base guests if applicable.
- **Use:** Search and checkout.

### BookingSummary

- **Props:** `checkIn`, `checkOut`, `nights`, `guests`, `listingTitle`, `listingImageUrl`, `onEdit` (link to change dates/guests).
- **Structure:** Compact card with dates, guests, listing thumbnail and title; "Edit" link. Tokens for spacing and typography.
- **Use:** Checkout sidebar or step.

### PriceBreakdown

- **Props:** `lineItems` (array of { label, amountCents, currency }), `totalCents`, `currency`, `collapsible`.
- **Structure:** List of rows (label + formatted amount); total row emphasized. Optional "See breakdown" to expand.
- **Use:** Listing sidebar, checkout, confirmation. Never hide total; always show at least summary.

### CheckoutForm

- **Props:** `bookingSummary`, `priceBreakdown`, `guestDetails` (fields), `paymentSection`, `onSubmit`, `loading`, `submitLabel`.
- **Structure:** Vertical stack: summary, guest form (inputs from UI), payment (from payment provider or saved methods), terms/cancellation notice, submit button. Single column; max width from tokens.
- **Use:** Checkout page; composes BookingSummary, PriceBreakdown, form fields, and payment component.

### BookingStatusBadge

- **Props:** `status` (reserved | confirmed | cancelled | completed), `size`.
- **Renders:** Badge with semantic color and label from design system; same mapping as API.
- **Use:** Trip list, booking detail, host reservations list.

### ReservationTimeline

- **Props:** `checkIn`, `checkOut`, `status`, `upcomingSteps` (e.g. "Message host", "Get directions").
- **Structure:** Vertical timeline or steps; dates and status; CTAs for next steps.
- **Use:** Booking confirmation and trip detail.

### Flow assembly

- **Checkout flow:** Page uses `CheckoutLayout`; step 1 = dates/guests (CalendarSelector, GuestCounter) + BookingSummary + PriceBreakdown; step 2 = guest details form; step 3 = payment + final PriceBreakdown + submit. State in page or checkout context; submit calls API and redirects to confirmation.
- **Trip detail:** Page shows BookingSummary, BookingStatusBadge, ReservationTimeline, and actions (Message host, Cancel, Get directions, Leave review). Data from React Query by booking id.

---

## 8. Dashboard components

Reusable in host, owner, broker, and admin dashboards. Live in `shared/components/dashboard/` or `ui/dashboard/`.

### MetricCard

- **Props:** `label`, `value` (string or number), `trend` (optional { direction, value }), `icon` (optional), `href` (optional).
- **Structure:** Card with large value (tabular figures), label below, optional trend with color (up/down). Padding and typography from tokens.
- **Use:** Dashboard home; KPI rows.

### ChartContainer

- **Props:** `title`, `children` (chart component), `height`, `loading`, `emptyMessage`.
- **Structure:** Card or panel; title; loading skeleton or chart; empty state if no data.
- **Use:** Wraps Recharts (or similar) with consistent padding and empty/loading handling.

### DataTable

- **Props:** `columns` (array of { key, label, sortable, align, render }), `data`, `keyField`, `loading`, `pagination` (page, pageSize, total, onPageChange), `rowActions`, `emptyMessage`.
- **Structure:** Table with sticky header; sort icons; row hover; actions column or menu. Pagination below. Use tokens for borders and spacing.
- **Responsive:** Below breakpoint, render as cards (one card per row) or horizontal scroll with sticky first column.
- **Use:** Admin tables; CRM lists; bookings; incidents.

### StatusBadge

- **Props:** `status` (string), `variant` (default | success | warning | error), `size`.
- **Renders:** Pill with background and text from semantic colors; used for booking, payment, dispute, lead status.
- **Use:** Tables, cards, detail headers. Map API status to variant in one place.

### ActivityFeed

- **Props:** `items` (array of { id, icon, title, description, time, href }), `emptyMessage`, `maxItems`.
- **Structure:** Vertical list; each item has icon, title/description, time; link if href. Tokens for spacing.
- **Use:** Dashboard sidebar or block; recent activity.

### NotificationPanel

- **Props:** `notifications` (array), `onMarkRead`, `onClick`, `emptyMessage`.
- **Structure:** List of notification items (icon, title, body, time, unread state); "Mark all read"; empty state.
- **Use:** Header dropdown or dedicated page. Compose with same list and empty patterns.

### Composition rules

- Dashboards use `DashboardLayout`; main content is a grid of `MetricCard` and `ChartContainer`; list pages use `DataTable` or card list; filters use `FilterPanel` or inline filter bar with primitives. All use the same tokens and StatusBadge/MetricCard so host, owner, broker, and admin feel consistent.

---

## 9. Messaging components

Live in `features/messaging/components/` or `shared/components/messaging/`.

### ConversationList

- **Props:** `conversations` (array of { id, title, lastMessage, unreadCount, updatedAt, participants }), `activeId`, `onSelect`, `loading`, `emptyMessage`.
- **Structure:** Scrollable list; each item shows avatar(s), title/preview, time, unread badge; active state. Use tokens for spacing and typography.
- **Use:** Inbox page; sidebar on desktop; list on mobile before opening thread.

### ChatThread

- **Props:** `messages` (array of { id, senderId, body, createdAt, readAt }), `currentUserId`, `loading`, `onLoadMore`, `hasMore`.
- **Structure:** Scrollable area; messages as bubbles or blocks; sender alignment (right for current user); timestamps grouped. Scroll to bottom on new message or mount.
- **Use:** Thread view; composes MessageBubble.

### MessageBubble

- **Props:** `body`, `isOwn`, `createdAt`, `readAt`, `status` (sending | sent | read).
- **Structure:** Rounded block; background different for own vs other; time and optional read indicator below.
- **Use:** Rendered by ChatThread.

### AttachmentPreview

- **Props:** `file` (name, url, type, size), `onRemove`, `uploadProgress` (optional).
- **Structure:** Thumbnail or icon + name + size; remove button; progress bar if uploading.
- **Use:** In composer and in message display.

### TypingIndicator

- **Props:** `visible`, `label` (e.g. "Host is typing").
- **Structure:** Small animated dots or text; appears above composer when visible.
- **Use:** Real-time or polled typing state; optional.

### Real-time considerations

- **Polling or WebSocket** — Messages and typing can be fetched on interval or pushed; component API stays the same (messages array, typing boolean). Keep message list in server-state cache; append new messages and invalidate on send.
- **Optimistic update** — On send, add message to list with status "sending"; replace with server response on success; show error and allow retry on failure.
- **Unread count** — From API or derived; update on mark-read and when opening thread; use for badge in nav.

---

## 10. Trust and safety components

These communicate seriousness and support without causing panic. Live in `shared/components/trust/` or `features/trust-safety/components/`.

### VerificationBadge

- **Props:** `type` (identity | host | listing), `size`, `showLabel`.
- **Renders:** Checkmark or shield icon in success color; optional "Verified" or "Identity verified" label. One canonical style across app.
- **Use:** Profile, listing detail, host card. Only show when verification status is verified.

### IncidentReportForm

- **Props:** `onSubmit`, `defaultValues` (reportedUserId, bookingId, etc.), `loading`.
- **Structure:** Form: type (select), description (textarea), optional evidence (FileUploader); submit and cancel. Labels and error handling from form system; copy calm and factual.
- **Use:** Incident reporting page; linked from footer, profile, or booking.

### WarningBanner

- **Props:** `title`, `message`, `action` (optional { label, onClick }), `variant` (warning | info), `dismissible`, `onDismiss`.
- **Structure:** Full-width bar or card; icon + title + message + optional action button; close button if dismissible. Background and border from semantic (warning = amber).
- **Use:** Payout hold, action required, policy update. Not for critical errors (use error variant or dedicated error UI).

### PolicyNotice

- **Props:** `title`, `content` (string or node), `link` (optional { label, href }).
- **Structure:** Card or block; title; short readable text; link to full policy. Neutral background.
- **Use:** Checkout (cancellation policy); footer; dispute flow.

### EvidenceUploader

- **Props:** `accept`, `maxSize`, `maxFiles`, `value` (files or urls), `onChange`, `disabled`.
- **Structure:** Same as FileUploader; add context text ("Attach photos or documents"); list of uploaded items with remove. Used inside IncidentReportForm or dispute flow.
- **Use:** Incident and dispute evidence; verification document upload.

### Implementation notes

- **Tone** — All copy in these components should be calm and factual; avoid "Warning!" or "Danger" unless severity is critical. Use design system wording (see Design System Blueprint §32).
- **Visibility** — Verification badges only when verified; warning banners only when relevant (e.g. payout hold). Do not overuse so that users become desensitized.
- **Accessibility** — Forms and banners must have proper labels and live regions so screen readers announce status and errors.

---

## 11. Form implementation patterns

### Validation rules

- **Schema-based** — Use Zod, Yup, or similar: define schema once; validate on blur and submit. Map schema errors to field-level errors and summary.
- **Async validation** — For "email already exists" or similar, run after blur or submit; show error next to field and optionally in summary.
- **Rules in one place** — Validation schemas live next to the form or in a shared validators module; components receive `error` and `onChange` from form state.

### Error handling

- **Field errors** — Each field shows error below (from form state); red border or ring from tokens.
- **Summary** — On submit, if errors exist, show "Please fix the errors below" and link or focus to first error. Use `aria-describedby` to associate summary with form.
- **API errors** — Map 4xx to field errors when possible (e.g. "email already taken" → email field); otherwise show toast or banner and leave form filled for retry.

### Multi-step forms

- **State** — Hold step index and all step data in one state (useReducer or form lib with step logic). Persist to server at end or at each step (e.g. draft listing).
- **UI** — Step indicator at top; "Back" and "Next"/"Submit" buttons; validate current step before advancing; optional "Save draft" that posts partial data.
- **Accessibility** — Only current step in tab order or visible; announce step change; focus to first field of new step.

### Autosave patterns

- **Debounce** — On change, debounce 500–1000ms then PATCH to API. Show "Saving..." and "Saved" indicator; on failure show "Save failed" and retry or manual save.
- **Conflict** — If another client updated, optionally refetch and merge or show "Updated by someone else" and let user refresh. Prefer optimistic update with refetch on focus.

### File uploads

- **Client** — Validate type and size before upload; show progress; on success store file id or url in form value; pass to submit.
- **Server** — Use presigned URL or direct upload API; form submits only references. See API Blueprint §24 (media).

### Success states

- **After submit** — Redirect to next page or show in-form success (e.g. "Saved" checkmark). Do not rely only on toast; critical actions should have visible confirmation in flow (e.g. booking confirmation page).

---

## 12. State management patterns

### Server data state

- **Library** — React Query (or SWR). Keys: `['listings', filters]`, `['booking', id]`, `['user', 'me']`.
- **Where** — Hooks (e.g. `useListings(filters)`, `useBooking(id)`) that call API and return `{ data, isLoading, error, refetch }`. Components use hooks; no direct API calls in components.
- **Caching** — Stale time per resource type (e.g. listings 1 min, user 5 min); invalidate on mutation (e.g. after create booking invalidate trips list).

### Authentication state

- **Global** — Context or small store: `{ user, token, isLoading, login, logout }`. Token in memory or httpOnly cookie; refresh before expiry.
- **Persistence** — Token only; user object can be refetched. No sensitive data in localStorage beyond token if required by stack.
- **Route guard** — Wrapper component or route config: if !user && !isLoading redirect to login with returnUrl; if user && requiredRole && !hasRole redirect to 403 or home.

### UI interaction state

- **Local** — Modal open, sidebar collapsed, selected tab: `useState` in component or nearest parent. No need for global store for one-screen UI.
- **Shared UI** — Sidebar collapse or theme: small context or store so multiple components can read/write. Prefer URL for shareable state (e.g. filters in query string).

### Form state

- **Local** — Use React Hook Form, Formik, or controlled state in component. For multi-step or large forms, state can live in parent or context scoped to flow (e.g. checkout).
- **No global** — Form state is not in global store unless it is a persistent draft shared across routes.

### Notification state

- **List and unread count** — From server (React Query); update on mark-read and when new notification arrives (poll or push). Optional small context for "toast" queue if toasts are triggered from many places.
- **Toasts** — Queue in context or store; add/remove by id; auto-dismiss after duration. Components call `toast.success(message)` etc.; no need to hold toast list in server state.

### When to use global vs local

- **Global:** Auth, theme, sidebar collapse, toast queue, optional checkout context for multi-step flow.
- **Local:** Everything else: form state, modal open, selected item, filters (unless synced to URL). Prefer local; add global only when multiple trees need the same value or when persisting across navigation.

---

## 13. API integration layer

### API client structure

- **Single client** — Create one instance (axios or fetch wrapper) with base URL from env, `Authorization: Bearer <token>` from auth state, and headers: `Content-Type: application/json`, `X-Request-Id` (uuid per request). Interceptors: on 401 try refresh token and retry once; on 4xx/5xx map to error shape (code, message, details).
- **Usage** — Components never import the client directly. Hooks (e.g. `useApi()`) or service functions (e.g. `bookingsApi.get(id)`) use the client and return data or throw typed errors.

### Request handling

- **Hooks** — For GET: `useQuery(key, fetcher)`; for mutate: `useMutation(mutateFn, { onSuccess, onError })`. Fetcher and mutateFn call API client. Keys include resource and params so cache is correct (e.g. `['bookings', { guestId }]`).
- **Loading and error** — Hooks expose `isLoading`, `isError`, `error`; components show skeleton or error state and retry. No silent failures.

### Error handling

- **Shape** — Consume API error response (see API Blueprint §27): `error.code`, `error.message`, `error.details`. Map to user-facing message; for validation errors, map details to field errors.
- **Retry** — Retry 5xx and 429 with backoff; do not retry 4xx (except 401 with refresh). Expose retry from hook (e.g. `refetch`).

### Authentication token handling

- **Attach** — Client reads token from auth context/store and sets header each request (or on inject). If no token, do not send Authorization; server returns 401 for protected routes.
- **Refresh** — On 401, call refresh endpoint; on success update token and retry original request; on failure clear auth and redirect to login.
- **Storage** — Token in memory (variable or context) or in httpOnly cookie. If cookie, client sends credentials; no manual header for cookie-based auth.

### Pagination logic

- **Page-based** — Request `?page=1&pageSize=20`; response includes `pagination: { page, pageSize, totalCount, hasMore }`. Cache key includes page; prefetch next page optional.
- **Cursor-based** — Request `?cursor=xxx&limit=20`; response includes `nextCursor`. Use for infinite list: append next page to list; `hasMore` from presence of nextCursor.
- **UI** — "Load more" or infinite scroll: fetch next page and merge; or show page numbers and fetch on click. Use same hook (e.g. `useInfiniteQuery`).

### Optimistic updates

- **Pattern** — On mutate (e.g. save, cancel booking), update cache immediately with expected result; on success invalidate or update with server response; on error rollback cache and show error.
- **When** — Use for non-critical mutations to make UI feel fast; avoid for payment or irreversible actions unless rollback is clear and tested.

---

## 14. Responsive implementation

### Breakpoints

- **Define once** — e.g. `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280` in tokens or theme. Use same values in CSS (media queries) and JS (e.g. useMediaQuery).
- **Mobile-first** — Base styles for mobile; add `min-width` media queries for larger screens. Or use a library that generates mobile-first classes.

### Responsive layout components

- **Container** — Max-width and padding change by breakpoint (e.g. full padding on mobile, constrained on desktop).
- **Grid** — Columns: 1 (default), 2 at md, 3–4 at lg. Pass as props or use CSS Grid with template that changes by breakpoint.
- **Stack** — Direction: column on mobile, row on lg; gap consistent or larger on desktop.
- **Sidebar layout** — Main + sidebar stack on mobile; row on lg; sidebar width fixed or collapsible.

### Mobile-first implementation

- **Default** — Layout and font sizes are for small viewport; touch targets at least 44px.
- **Progressive enhancement** — Add hover states, multi-column, and sidebar for larger viewports. Do not rely on hover for critical actions.

### Responsive tables and cards

- **Tables** — Below md: either horizontal scroll with sticky first column, or switch to card layout (one card per row, key columns as rows). Use one DataTable component with `responsiveMode: 'table' | 'cards'` or detect viewport inside.
- **Cards** — Grid 1 col → 2 → 3–4 by breakpoint; card content may hide secondary info on small (e.g. show only title, price, image).

### Touch-friendly interactions

- **Target size** — Buttons and links min 44×44px on touch devices; increase padding rather than font only.
- **Spacing** — Gap between tappable elements so mis-tap is unlikely. Avoid hover-only actions; provide tap target for everything actionable.
- **Swipe** — Optional for carousel or list actions (e.g. swipe to delete); ensure alternative (e.g. long-press menu or row action) for accessibility.

---

## 15. Performance optimization

### Code splitting

- **Routes** — Lazy-load route-level components: `const Dashboard = lazy(() => import('./Dashboard'))`; wrap in Suspense with fallback (skeleton or spinner). Split by app area (public, platform, admin).
- **Heavy components** — Lazy-load chart lib, map, or rich editor only when the parent mounts or is in view. Same pattern: lazy + Suspense.

### Lazy loading

- **Below fold** — Images and lists below fold: use `loading="lazy"` or Intersection Observer to load when near viewport. Skeleton for list items until loaded.
- **Data** — Load initial page quickly; fetch secondary data (e.g. reviews, related) after first paint or when tab is visible.

### Image optimization

- **Responsive** — Use srcset/sizes for images; serve WebP/AVIF where supported. Listing images: multiple sizes so card gets small, detail gets large.
- **CDN** — Serve from CDN with cache headers. Optional blur placeholder (e.g. base64 thumbnail) while full image loads.
- **Aspect ratio** — Reserve space with aspect-ratio or padding-bottom to avoid layout shift.

### List virtualization

- **When** — Lists with 100+ items (search results, messages, admin table). Use react-window, react-virtualized, or similar: render only visible rows.
- **Props** — Item height (fixed or variable), total count, renderItem. Scroll container must have fixed height or max-height.
- **Accessibility** — Ensure keyboard nav and screen reader can understand list length and position; avoid "infinite" without landmarks.

### Bundle size management

- **Analyze** — Use bundle analyzer (e.g. webpack-bundle-analyzer); identify large deps. Prefer tree-shakeable imports (e.g. `import { X } from 'lib'` not `import Lib`).
- **Chunks** — Split vendor (react, router) and app; split by route. Lazy load heavy libs (chart, map, date lib).
- **Duplication** — Ensure single instance of react and shared deps across chunks; use shared runtime if multiple apps.

### Caching strategies

- **API** — React Query stale time and cache time per resource; invalidate on mutation. Consider longer cache for static or slow-changing data.
- **Assets** — Cache static assets with hash in filename; long cache. HTML or entry point: no-cache or short cache so users get new chunks.
- **Optional** — Service worker for offline or cache-first for static content; document scope and update strategy.

---

## 16. Accessibility implementation

### Semantic HTML

- **Use elements** — `<button>`, `<a>`, `<input>`, `<label>`, `<section>`, `<nav>`, `<main>`, `<article>`, `<heading levels>`. Do not use `<div>` for buttons or links; use `<button>` and `<a>` with correct href.
- **Landmarks** — Page has one `<main>`; nav in `<nav>`; complementary in `<aside>`. Headings in order (h1 → h2 → h3).

### ARIA where needed

- **When** — When semantic HTML is not enough: e.g. custom dropdown (role="listbox", aria-expanded, aria-activedescendant), modal (role="dialog", aria-modal), live region for toast (aria-live="polite").
- **Don’t override** — Prefer native element + styling over div + role when possible. Avoid aria when HTML already gives the meaning (e.g. use `<button>` not `<div role="button">`).

### Keyboard navigation

- **Focusable** — All interactive elements focusable (native or tabIndex=0); tab order matches visual order. Remove tabIndex=-1 only when trapping focus (e.g. modal).
- **Handlers** — Buttons and links: Enter and Space (button). Custom components: Arrow keys and Enter where appropriate (e.g. listbox, menu). Escape closes modal or dropdown.
- **Focus trap** — In modal: trap focus inside; on close restore focus to trigger. Use focus-trap library or implement with focusable elements and keydown.

### Focus management

- **Visible focus** — Every focusable element has visible focus ring (outline or box-shadow from tokens). Do not remove outline without replacing with another visible ring (2px offset).
- **Focus after action** — After open modal, move focus to first focusable or title. After close, restore to trigger. After submit success, focus confirmation message or next CTA.
- **Focus on error** — On form submit with errors, focus first error field or move to error summary that references fields.

### Screen reader compatibility

- **Labels** — All inputs have associated label (visible or sr-only). Use aria-label only for icon-only buttons.
- **Errors** — Link error message with aria-describedby or aria-errormessage; ensure message is announced.
- **Dynamic content** — Use aria-live for toasts and critical updates; avoid live for every small change (can be noisy).
- **Testing** — Run axe-core in CI; test key flows with NVDA or VoiceOver; fix issues before release.

---

## 17. Component testing strategy

### Unit tests for components

- **Scope** — Primitives (Button, Input, Select) and composed components (ListingCard, PriceBreakdown). Test rendering with props, user events (click, type), and that callbacks are called with expected args.
- **Tools** — React Testing Library (RTL) + Jest or Vitest. Query by role and label; avoid implementation details.
- **Examples** — Button: render with label; click triggers onClick; disabled prevents click; loading shows spinner and is disabled. Input: type in value; error shows message; label associated.

### Interaction tests

- **Scope** — Multi-step flows within one component or small tree: e.g. Select open, choose option, value updated; DatePicker select range, onChange called.
- **Tool** — Same RTL; fireEvent or userEvent for sequences. Assert final state and callbacks.

### Visual regression tests

- **Scope** — Design system components and key pages (listing card, checkout summary, dashboard card). Capture screenshot; compare on change.
- **Tools** — Percy, Chromatic, or Jest + screenshot comparison. Run on token or component change; approve intentional changes.
- **Caution** — Flakiness from fonts, animations, or timing; use deterministic data and disable animations in test if needed.

### Accessibility testing

- **Automated** — axe-core in unit tests (e.g. axe-core with RTL render) and in E2E. Fail build on violations for critical components and pages.
- **Manual** — Keyboard through critical flows (login, search, book, checkout); screen reader (NVDA/VoiceOver) for same flows. Document and fix issues.
- **Coverage** — Every primitive and shared component should have at least one test that includes a11y check (RTL + axe).

### When to write what

- **Unit** — Every new or changed primitive; high-value composed components (ListingCard, PriceBreakdown, forms).
- **Integration** — Key flows (add to cart/booking, submit form, filter search) in one page or feature.
- **E2E** — Login, search → listing → checkout, host approve, payout (critical paths); run against staging API.
- **A11y** — In unit tests for components; in E2E for full flows. Manual for new patterns.

---

## 18. Frontend folder structure

Use a structure that supports modular development and clear boundaries. Below is an expanded version of the Frontend Architecture Blueprint §34.

```
src/
  app/                      # Routes and layout wrappers
    routes/                 # Or pages/ for file-based routing
      public/
      auth/
      platform/
      admin/
    layouts/
      MarketingLayout.tsx
      DashboardLayout.tsx
      CheckoutLayout.tsx
    providers/              # Auth, theme, query client
  pages/                    # Route-level pages (if not colocated with app)
    HomePage.tsx
    ListingDetailPage.tsx
    ...
  features/                 # Feature modules
    auth/
      components/
      hooks/
      api/
    listing/
      components/
      hooks/
    booking/
      components/
      hooks/
    search/
    messaging/
    crm/
    owner/
    admin/
  shared/
    components/              # Cross-feature composed components
      ListingCard.tsx
      PriceDisplay.tsx
      HostCard.tsx
      dashboard/
      messaging/
    hooks/
      useMediaQuery.ts
      useAuth.ts
    api/
      client.ts
      endpoints/
    utils/
      format.ts
      validation.ts
    constants/
  ui/                       # Design system primitives
    Button.tsx
    Input.tsx
    Select.tsx
    Card.tsx
    ...
    layout/
      Container.tsx
      Grid.tsx
      Stack.tsx
  styles/
    tokens.css
    globals.css
  assets/
    images/
    icons/
```

### Rules

- **app** — Routing and layout composition; minimal logic. Layouts wrap routes and provide sidebar/header/footer.
- **pages** — One component per route (or per file in file-based routing); they compose features and shared components and use hooks for data.
- **features** — One folder per domain (auth, listing, booking, etc.). Each feature has its own components, hooks, and API calls. Features do not import from other features; they use shared and ui.
- **shared** — Components and utilities used by more than one feature (ListingCard, PriceDisplay, API client, formatCurrency). Shared components can depend on ui and hooks.
- **ui** — Only design system primitives and layout; no feature logic, no API calls. Used by shared and features.
- **styles** — Global tokens and resets; component styles live with components (CSS-in-JS or CSS Modules).

### How this supports modular development

- **Clear dependencies** — ui ← shared ← features ← pages/app. No feature → feature; no page importing from deep feature internals.
- **Lazy loading** — Route-level split by app segment; feature chunks can be split by route that uses them.
- **Testing** — Test ui and shared in isolation; test features with mocked shared/api; test pages with mocked features or full integration.
- **Ownership** — Teams or contributors can own a feature folder; changes to shared and ui are coordinated.

---

## 19. Component documentation

### Per-component documentation

Each component (at least in ui and shared) should have:

- **Purpose** — One sentence: when to use it; when not to use it.
- **Usage example** — Minimal code: import, props, and typical use (e.g. primary button; input with error).
- **Props reference** — Table: name, type, default, description. Include all public props.
- **Variants** — List variants (e.g. primary/secondary/ghost) and sizes; show how to pass them.
- **States** — Default, hover, focus, disabled, loading, error; how to trigger and what to expect.
- **Accessibility notes** — What the component does for keyboard, focus, and screen reader; any required props (e.g. label for Input).
- **Dos and don’ts** — 2–4 each (e.g. "Do use for primary action only" / "Don’t use multiple primary buttons in one section").

### Where to document

- **Storybook** — Preferred: stories per component with variants and states; props table from types or docgen; a11y addon. Publish to internal URL so designers and QA can reference.
- **README or doc site** — Overview of design system and how to use tokens; link to Storybook for components.
- **Code comments** — JSDoc for props and complex logic; keep comments up to date when behavior changes.

### Maintenance

- **New component** — Add story and props table before or with first PR. Add to design system doc.
- **Breaking change** — Update story and doc; call out in changelog; migration note if needed.

---

## 20. Implementation workflow

### Design handoff process

- **Design** — Designs in Figma (or equivalent) using design system components and tokens. Export or link token values (color, spacing, type).
- **Spec** — Designer provides: screen or flow, component breakdown (which primitives and patterns), states (loading, error, empty), and copy. No need to redraw in code; reference design and tokens.
- **Questions** — Engineer clarifies: edge cases (long text, many items), responsive behavior, a11y expectations. Resolve before implementation.

### Component creation

- **Order** — Implement tokens first (CSS variables or theme); then primitives (Button, Input, Card); then shared composed (ListingCard, PriceDisplay); then feature-specific components.
- **Checklist** — New component: uses tokens only; supports required states; has ref if needed; passes a11y tests; has story and props doc.
- **Review** — Code review checks: tokens, a11y, no one-off styles, tests present.

### Feature assembly

- **Page** — Page component composes layout + feature components + shared components. Data from hooks (React Query, auth). No business logic in page beyond wiring.
- **Flow** — Multi-step flows (checkout, onboarding): state in component tree or small context; step indicator and navigation; validation and submit at end or per step.
- **Integration** — Connect to API via hooks; handle loading and error in UI; add analytics or logging where required.

### Testing

- **Unit** — Run on commit or PR for changed components and touched features. Must pass.
- **E2E** — Run on PR or nightly for critical paths; against staging or mock API. Fix failures before merge.
- **A11y** — Automated (axe) in CI; manual check for new flows. No critical violations.

### Review and deployment

- **Review** — Peer review for logic, structure, and design alignment. Designer review optional for high-impact UI.
- **Deploy** — Standard CI/CD: build, test, deploy to staging then production. Feature flags if needed for gradual rollout.
- **Monitor** — Errors and performance (e.g. LCP, CLS) in production; fix regressions.

---

## 21. Long-term maintainability

### Component reuse

- **Before new component** — Check ui and shared for existing primitive or composed component. If similar but not quite right, extend with props or variant instead of duplicating.
- **Refactor** — When the same pattern appears in multiple places, extract to shared component and use tokens; update all call sites.
- **Deprecation** — If replacing a component, add deprecation notice and new recommended component in doc; migrate usages; remove old component after grace period.

### Design system governance

- **Tokens** — Add or change tokens only with design system owner or documented decision; update token file and doc; communicate to team.
- **Primitives** — New primitives go through review (design + eng); must have variants, states, a11y, and story. Changes to existing primitives must not break current usages or have migration path.
- **Consistency** — Periodic audit: do new pages use layout and shared components? Are there new one-off styles? Address in tech debt sprint or as part of feature work.

### Technical debt management

- **Track** — List known debt (e.g. "Replace inline styles in X with tokens", "Add tests for Y"). Prioritize by impact and effort.
- **Allocate** — Dedicate a share of each sprint or recurring time to pay down debt. Prefer incremental improvement over big rewrites.
- **Prevent** — Lint rules (e.g. no inline color or margin); review checklist; design review for new screens so one-offs are caught early.

### Consistent documentation

- **Single source** — Design system doc (Design System Blueprint); implementation (this guide); component API (Storybook + props). Keep links between them.
- **Onboarding** — New engineers read: repo README, this guide, and token/component docs. Point to Storybook and key flows.
- **Updates** — When behavior or API changes, update code, tests, and doc together. Changelog for design system and app releases.

---

This guide is the practical bridge between the LECIPM design system and frontend architecture and the implemented codebase. Use it to create reusable components, integrate APIs, test and document UI, and keep the frontend scalable and maintainable across web and mobile.

---

*References: [LECIPM Design System Blueprint](LECIPM-DESIGN-SYSTEM-BLUEPRINT.md), [LECIPM Frontend Architecture Blueprint](LECIPM-FRONTEND-ARCHITECTURE-BLUEPRINT.md), [LECIPM API Architecture Blueprint](LECIPM-API-ARCHITECTURE-BLUEPRINT.md).*
