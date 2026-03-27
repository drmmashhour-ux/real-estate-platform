# Public launch & acquisition (web app)

## Messaging

- **Homepage hero:** “AI Real Estate Investment Platform” + subtext on analysis, comparison, portfolio.
- **Onboarding strip:** “No experience needed — analyze your first deal in seconds”.
- **Primary CTA:** “Start Free Analysis” → `/analyze#analyzer` (form has `id="analyzer"` + `scroll-mt` for sticky nav).
- **Meta (default):** Title *Analyze Real Estate Deals Instantly*; description compares long-term vs Airbnb with AI insights (`app/page.tsx`, `app/layout.tsx`, `app/analyze/page.tsx`).

## Frictionless analyze

- `/analyze` is public; **Save** in demo mode uses **local** storage (no login).
- **Account save** uses `/api/investment-deals`; **401** → login (expected).
- **Live dashboard** `/dashboard` uses `requireAuthenticatedUser()`; guests use **`/demo/dashboard`**.

## Performance

- `LAUNCH_LIGHT_HOME_FETCH`: skips heavy DB/API fetches for featured listings, projects, testimonials, and recos when combined with `INVESTMENT_HUB_FOCUS`.
- Marketplace strips (BNHub stays, luxury, projects, brokers) are **not rendered** when `INVESTMENT_HUB_FOCUS` (code remains; routes still work).
- **Lazy:** `ContinueInvestmentBanner`, `InvestmentGrowthHome`, `MainSearchBar`, `StaysRecommendationGrid`, `TrustCredibilitySections`, `LecipmPlatformExplainSections`.
- **`/analyze/loading.tsx`:** skeleton while the analyze segment loads.

## Footer (global)

- Top row: **About** → `/about-platform`, **FAQ** → `/#faq-lecipm`, **Contact** → `/contact`.

## Flags (`lib/product-focus.ts`)

- `INVESTMENT_HUB_FOCUS` — investment-first UX.
- `LAUNCH_LIGHT_HOME_FETCH` — lighter homepage server work for launch traffic.
