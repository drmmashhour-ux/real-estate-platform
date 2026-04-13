# LECIPM sign-point review (first-time client)

**Scope:** Places where a user decides, clicks a CTA, submits data, trusts the platform, or advances in a funnel. Each sign point should answer: **What is happening?** · **Why should I trust this?** · **What should I do next?**

---

## `/` — Marketing home (`LecipmHomeLanding`)

### Sign point: First landing impression (hero + primary CTAs)

**Problem:** Dense value prop without an explicit “start here” hierarchy for anxious first-time visitors.

**Why it hurts conversion or trust:** Users scan for one obvious next step; competing equal-weight links increase bounce.

**Fix implemented:** Hero uses a single H1, grouped primary actions with `aria-label="Primary actions — start with Explore listings"`, gold primary CTA “Explore listings”, secondary paths (“List a property”, “Brokers & sellers”, “Watch overview”), AI disclaimer, and a **Trust & standards** strip (auth/payments, OACIQ context, market focus).

**Remaining dependency if any:** Replace dev fallback YouTube embed in production via `NEXT_PUBLIC_LECIPM_LANDING_YOUTUBE_ID` or `NEXT_PUBLIC_LECIPM_LANDING_VIDEO_URL`.

---

## `/listings` — Browse & search (`ListingsBrowseClient`, `SearchEngine`, map)

### Sign point: Search input

**Problem:** Unclear whether search state is shareable or persisted.

**Why it hurts conversion or trust:** Users fear losing work when navigating away.

**Fix implemented:** Embedded browse explains “Filters sync to the URL — share or bookmark your results.”

**Remaining dependency if any:** None for copy; deep-link behaviour is URL-driven.

### Sign point: Filter panel apply / reset (`BrowseFilterPanelFooter`)

**Problem:** Labels like “Reset”, “Close”, “Search” were ambiguous; no explanation of the count.

**Why it hurts conversion or trust:** Users close the panel without applying, or misread “Search” as a new web search.

**Fix implemented:** Helper text: update filters then apply; count described as an estimate. Buttons: **Clear all filters**, **Close panel**, primary **Apply & view results (…)**.

**Remaining dependency if any:** Count accuracy depends on server estimate API; copy sets expectation.

### Sign point: Listing card click (grid → detail)

**Problem:** (Low) Implicit — entire card navigates to detail.

**Why it hurts conversion or trust:** Accidental clicks if hit targets overlap (mitigated by standard patterns).

**Fix implemented:** No code change this pass; browse uses consistent cards and favorite button stops propagation.

**Remaining dependency if any:** None.

### Sign point: Save / favorite on browse row (`BrowseListingFavoriteButton`)

**Problem:** Silent success/failure; failed saves felt broken.

**Why it hurts conversion or trust:** No feedback breaks the “save for later” mental model.

**Fix implemented:** `useToast` on success (saved / removed) and on API error with a retry-oriented message; 401 still redirects to login with return URL.

**Remaining dependency if any:** User must be authenticated for API — behaviour unchanged.

### Sign point: No results / empty state

**Problem:** Dead-end “no matches” without alternatives.

**Why it hurts conversion or trust:** Users assume the platform has no inventory.

**Fix implemented:** `EmptyState` title and description explain widening filters; CTAs **Clear search filters** and **Browse short-term stays** (BNHub path).

**Remaining dependency if any:** Stays inventory depends on BNHub data.

---

## `/listings/[id]` — Property detail (`BuyerListingDetail`)

### Sign point: Primary contact CTA

**Problem:** Generic labels (“Contact broker”, “Unlock contact instantly”) did not state paywall or role.

**Why it hurts conversion or trust:** Surprise at checkout or unclear who receives the message.

**Fix implemented:** Primary labels: **Unlock seller contact (secure checkout)** when gated; **Message the listing broker** for CRM; **Message the property seller** for FSBO. Existing friction line: “No commitment • Takes 30 seconds • No hidden fees”.

**Remaining dependency if any:** Stripe/checkout for lead unlock requires configured billing.

### Sign point: Save to list (header + sidebar + mobile)

**Problem:** “Save” / “Saved” without confirmation of where items go.

**Why it hurts conversion or trust:** Users don’t know how to retrieve saved listings.

**Fix implemented:** Labels **Save to my list** / **★ Saved — remove** / **Saved — tap to remove**; tooltips; success toasts: saved → points to **My saved**; errors still surface inline.

**Remaining dependency if any:** Auth required — 401 paths unchanged.

### Sign point: Form submit (contact / platform / immo modals)

**Problem:** Partially addressed elsewhere — success copy exists for contact.

**Why it hurts conversion or trust:** Omitted here where already strong.

**Fix implemented:** No change this pass beyond primary/save; existing `setFeedback` messages remain.

**Remaining dependency if any:** Legal acknowledgments and content license gates still apply.

---

## `/signup` — Account creation (`SignupAccountClient`)

### Sign point: Sign up form submit

**Problem:** Error text not announced to assistive tech; submit label didn’t state the email verification step.

**Why it hurts conversion or trust:** Users abandon when the next step (inbox) is unclear.

**Fix implemented:** Errors use `role="alert"`; email field has helper text (verification link, same email across hubs); submit: **Create account — verify email next**.

**Remaining dependency if any:** Email delivery depends on SMTP/provider configuration.

---

## `/auth/login` — Sign in (`auth-login-client`)

### Sign point: Sign in form + post-registration message

**Problem:** (Earlier work) Fragile error handling and loading state.

**Why it hurts conversion or trust:** Opaque failures feel like security issues.

**Fix implemented:** Error panel, skeleton/loading patterns, success hints when `registered=1` / `verified=1` (existing routes).

**Remaining dependency if any:** Demo quick-login only when env allows.

---

## `/bnhub/booking/[id]` — Pay for booking (`BookingPayButton`)

### Sign point: Checkout / payment entry

**Problem:** Amber button clashed with LECIPM gold system; demo vs live Stripe was under-explained; errors not flagged as alerts.

**Why it hurts conversion or trust:** Visual inconsistency reduces premium perception; PCI trust needs explicit wording.

**Fix implemented:** Premium gold button styling; demo copy distinguishes in-app confirmation vs production Stripe; live copy explains Stripe-hosted checkout and that card data isn’t stored on LECIPM; button **Continue to Stripe checkout** / **Complete demo payment (no card)**; loading **Opening secure checkout…**; errors `role="alert"`; post-payment path clarified.

**Remaining dependency if any:** `stripeConfigured` from server; webhook updates booking status.

---

## Hub dashboards — Shell (`HubLayout` + `HubSwitcher`)

### Sign point: Logout / end session

**Problem:** No obvious exit from authenticated hub shell — users hunted for “log out” in account menus.

**Why it hurts conversion or trust:** Session anxiety (especially on shared devices) without a clear control.

**Fix implemented:** **`HubLogoutButton`** next to hub switcher: POST `/api/auth/logout`, success toast, redirect `/` with refresh; title explains session end.

**Remaining dependency if any:** Middleware/session invalidation must match API route (existing).

### Sign point: Dashboard “quick actions” (portfolio / hub entry)

**Problem:** Investment portfolio (`/dashboard`) is deal-centric; “quick action” is implicit via `MvpNav`, watchlist strip, and modules.

**Why it hurts conversion or trust:** First-time users may not discover watchlist vs deals.

**Fix implemented:** No single new CTA this pass; page already surfaces **Open watchlist**, watchlist pulse, and AI selections. Hub **Sign out** improves wayfinding for session control.

**Remaining dependency if any:** Role-specific dashboards vary by hub — further IA work optional.

---

## Cross-cutting: Success / failure / toasts

### Sign point: Async actions (save, logout)

**Problem:** Silent operations feel untrustworthy.

**Why it hurts conversion or trust:** No confirmation → users repeat actions or leave.

**Fix implemented:** Toasts on save (listing detail, browse favorite), logout; booking errors as alerts.

**Remaining dependency if any:** `ToastProvider` in `app/providers.tsx` wraps the app.

---

## Cross-cutting: Forms (generic)

### Sign point: Submit buttons across admin/marketing forms

**Problem:** Not every form audited line-by-line in this pass.

**Why it hurts conversion or trust:** Inconsistent labels and missing `role="alert"` on errors.

**Fix implemented:** Signup pattern (alert + specific label) should be reused; BNHub payment button updated as reference.

**Remaining dependency if any:** Sweep remaining forms in a follow-up PR for `role="alert"` parity.

---

## Summary table

| Sign point | Primary fix |
|------------|-------------|
| Landing | Grouped CTAs + trust strip + AI disclaimer |
| Search | URL sync copy |
| Filters | Apply/close/clear + estimate helper |
| Listing click | Standard navigation (no change) |
| Contact CTA | Specific broker/seller/unlock copy |
| Save | Toasts + explicit labels |
| Sign up | Alert + email hint + submit label |
| Sign in | Existing error UX |
| Booking pay | Stripe trust copy + gold CTA + alerts |
| Dashboard | Hub logout + existing portfolio modules |
| Forms | Signup + payment as templates |
| Messages | Toasts/alerts where added |
| Logout | Hub header button |
| Empty state | No-results CTAs + stays escape hatch |

---

*Last updated: sign-point implementation pass (web app `apps/web`).*
