# BNHub Guest Mobile

Expo starter app for the BNHub guest experience.

## What is included

- Guest trip list from `/api/mobile/bnhub/trips`
- Booking detail from `/api/mobile/bnhub/bookings/[id]`
- Reservation notification inbox from `/api/mobile/bnhub/notifications`
- Guest account summary from `/api/mobile/bnhub/account/me`
- Guest cancellation action
- Expo push token registration to `/api/mobile/bnhub/devices`

## Local setup

1. Install workspace dependencies from the repo root:

```bash
pnpm install
```

2. Create mobile env file:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

3. Set the web API base URL in `apps/mobile/.env`.

4. Start the web app and mobile app:

```bash
pnpm dev:web
pnpm dev:mobile
```

## Authentication note

This starter expects the web backend to authenticate the same guest session used by the mobile endpoints. For production mobile login, the next step should be a token-based auth flow for Expo/native clients rather than browser-style cookie dependence.

## Recommended next improvements

- Add token-based mobile auth
- Replace the simple tab shell with Expo Router
- Add booking chat screen
- Add branded splash, icon, and store assets
- Add EAS project config and release profiles
# BNHub Mobile (Expo)

Premium guest / host / admin surfaces for the LECIPM + BNHub platform. Uses **Expo Router**, **Supabase Auth** (secure storage), **TanStack Query**, and **react-native-maps** (Expo Go–friendly). Mapbox can replace maps after a dev build (`@rnmapbox/maps`).

## Setup

1. Copy `.env.example` → `.env` and set `EXPO_PUBLIC_API_BASE_URL` to your machine’s LAN URL when testing on a device.
2. Root: `npm install`
3. Apply web-app migration `20260328090000_bnhub_mobile_safety_ecosystem` and `npx prisma generate` in `apps/web`.
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set on **web-app** so `/api/mobile/v1/me` can verify JWTs.
5. `npm run dev:bnhub-mobile` from repo root (or `npm start` in this package).

## Architecture

- **Auth**: Bearer token from Supabase session → Next.js `app/api/mobile/v1/*` validates via service role `auth.getUser`.
- **Roles**: `PlatformRole.ADMIN` → admin stack; `HOST` or any user with ≥1 listing → host stack; else guest.
- **Safety**: Public copy uses `public_message_key` mapping only — no neighborhood danger claims.
- **Secrets**: Only anon Supabase key and public API URL in the app.

## Scripts

| Script        | Description        |
| ------------- | ------------------ |
| `npm start`   | Expo dev server    |
| `npm run ios` | iOS simulator      |
| `npm run android` | Android emulator |
