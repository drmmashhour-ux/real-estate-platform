# Wix + LECIPM platform (Next.js)

The Wix site is the **marketing / landing** layer. The **product** (analyzer, demo dashboard, compare) lives on the Vercel-hosted Next.js app.

## 1. Buttons on Wix

1. Open your site in **Wix Editor**.
2. **Homepage**
   - Add a **button** (or reuse a hero CTA).
   - **Text:** `Start Investing`
   - **Link:** `https://lecipm.com` or your app URL, e.g. `https://app.lecipm.com` or `https://yourproject.vercel.app`
   - Set as **primary** style so it stands out.

3. **Section “Access the Platform”**
   - Add a **strip / section**.
   - **Title:** `Access the Platform`
   - **Paragraph:**  
     `Use our AI-powered tools to analyze, compare, and track real estate investments.`
   - Add a **button**:
     - **Text:** `Open Platform`
     - **Link:** same base URL as above (ideally `https://app.lecipm.com` or your canonical app domain).

> Tip: Use **HTTPS** and one canonical domain (e.g. `app.lecipm.com`) so cookies and analytics stay consistent.

## 2. Subdomain `app.lecipm.com` → Vercel

1. **DNS (Wix / domain host where `lecipm.com` is managed)**  
   Add a **CNAME** record:
   - **Host / Name:** `app`
   - **Points to:** `cname.vercel-dns.com` (or the target Vercel shows after you add the domain).

2. **Vercel** → your project → **Settings** → **Domains**  
   - Add `app.lecipm.com`  
   - Follow DNS instructions until the certificate is **Valid**.

3. **Environment variables** in Vercel:
   - Set `NEXT_PUBLIC_APP_URL=https://app.lecipm.com` (Production).

4. **Wix** buttons should point to `https://app.lecipm.com` (or `/analyze` for a direct deep link: `https://app.lecipm.com/analyze`).

## 3. What the platform does for visitors from Wix

- **Homepage** (`/`) shows **Welcome to LECIPM Platform**, **Start Analyzing**, and **demo** navigation without login.
- **Email capture** (“Get early access / updates”) stores submissions in Postgres (`early_access_subscribers`).
- **Analytics** events (traffic + funnel) are recorded in `TrafficEvent` / platform analytics for:
  - Clicks to **Analyze** (`investment_analyze_click`)
  - **Saved deals** (`investment_deal_saved`)

Set GA4 in Vercel: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` for Google Analytics reporting.

## 4. Smoke test from Wix

1. Publish Wix.
2. Open the live Wix URL → click **Start Investing** / **Open Platform**.
3. Confirm you land on the app → `/analyze` works → save a deal → **Demo dashboard** or sign in for **Dashboard**.

## 5. Database migration (production)

After deploying code that includes `EarlyAccessSubscriber`, run:

```bash
cd apps/web
npx prisma migrate deploy
```

against production `DATABASE_URL`.
