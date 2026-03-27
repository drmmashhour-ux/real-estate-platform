# Public launch & acquisition (web app)

## Homepage

- **Headline:** “AI Real Estate Investment Platform”
- **Subtext:** “Analyze deals, compare strategies, and track your portfolio in one place”
- **Top strip:** “No experience needed — analyze your first deal in seconds”
- **Primary CTA:** “Start Free Analysis” → `/analyze#analyzer` (smooth scroll to the form; no login to analyze)
- **Secondary:** “View Dashboard” → `/dashboard` when signed in, `/demo/dashboard` when not
- **Social proof (static):** Section “Used by early real estate investors” with placeholder chips
- **Performance:** `LAUNCH_LIGHT_HOME_FETCH` skips heavy DB/API fetches on `/`; hero blocks use `next/dynamic`; homepage auth uses session cookie only (no Prisma round-trip)

## Sharing metadata

- **Title:** “Analyze Real Estate Deals Instantly” (see `app/page.tsx` `metadata` and root `app/layout.tsx`)
- **Description:** “Compare long-term vs Airbnb strategies with AI insights”

## Frictionless analyze

- **`/analyze`:** Open to all; analyzer form has `id="analyzer"` and `scroll-mt` for hash navigation
- **Save:** Logged-out users save to **demo** storage; logged-in users POST to `/api/investment-deals`
- **`/dashboard` & `/compare`:** Require auth; guests use **`/demo/dashboard`** and **`/demo/compare`** (including hero feature cards)

## Footer

- Launch strip: **About**, **FAQ** (`/#faq-lecipm`), **Contact**
