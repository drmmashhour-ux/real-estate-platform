# Mobile App Ready — APIs & Structure

## API compatibility

All web-app APIs are **mobile-ready**:

- **REST/JSON** — No desktop-only assumptions; standard `Content-Type: application/json`, cookie or header auth.
- **Auth** — `POST /api/auth/register`, `POST /api/auth/login`; session via cookie `lecipm_guest_id`. For native apps, send the cookie in requests or use a token (e.g. add a `Authorization: Bearer <token>` path later).
- **Listings** — `GET /api/bnhub/search`, `GET /api/bnhub/listings/[id]`; pagination via `limit` & `page`.
- **Bookings** — `POST /api/bnhub/bookings`, then `POST /api/stripe/checkout` with `paymentType: booking` and `bookingId` (redirect to Stripe; confirmation via webhook only).
- **Deals** — `GET /api/deals`, `GET /api/deals/[id]`, `POST /api/deals` (body: `listingId`, `priceCents`, and `buyerEmail` when broker/admin or when seller; do not send `buyerId`/`sellerId`/`brokerId`), `POST /api/deals/[id]/checkout`.
- **Payments** — Stripe Checkout URL returned from checkout APIs; open in WebView or browser for 3DS.

**Base URL:** Set `NEXT_PUBLIC_APP_URL` to your backend (e.g. `https://api.yourdomain.com`). Mobile app should call this base for all `/api/*` routes.

---

## Responsive web

The Next.js app uses Tailwind responsive breakpoints (`sm`, `md`, `lg`). Key flows work on small viewports; test on real devices for touch and layout.

---

## React Native / Flutter structure (prepare)

To ship a native app:

### Option A — React Native

```
mobile/
  package.json          # React Native + Expo or bare
  app/
    (auth)/
      login.tsx
      signup.tsx
    (tabs)/
      search.tsx
      bookings.tsx
      profile.tsx
  lib/
    api.ts              # fetch(BASE_URL + '/api/...')
    auth.ts             # store session / cookie or token
```

- Reuse API contracts; implement screens that call the same endpoints.
- For Stripe: use `expo-web-browser` or `react-native-webview` to open checkout URL, then deep-link back on success.

### Option B — Flutter

```
mobile_flutter/
  pubspec.yaml
  lib/
    api/
      client.dart       # Dio/HttpClient, baseUrl = env
      auth.dart
    screens/
      login.dart
      search.dart
      bookings.dart
```

- Same as above: same base URL and endpoints; implement UI in Dart.

### Shared

- **Environment:** `BASE_URL` (and optional `STRIPE_PUBLISHABLE_KEY` if using Stripe SDK in-app).
- **Auth:** After login/register, persist session (cookie or token) and send on each request.
- **Deep links:** Configure success/cancel URLs for Stripe and auth (e.g. `yourapp://auth/callback`).

No code in this repo for RN/Flutter yet; this doc defines the structure and API contract so a separate mobile project can be added without changing the backend.
