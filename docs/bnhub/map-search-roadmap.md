# Map search — roadmap (Mapbox vs Expo)

## Current implementation

- **Mobile** uses **`react-native-maps`** (`MapView`, `Marker`) — works in **Expo Go** and dev builds without native Mapbox setup.
- **`/api/bnhub/public/listings`** returns optional **`latitude` / `longitude`** when columns exist (`supabase-listings-marketplace-extensions.sql`).
- **Map screen** (`apps/mobile/src/app/map-search.tsx`) plots pins from listings that include coordinates.

## Optional: Mapbox (`@rnmapbox/maps`)

- Use when you need Mapbox styles, offline packs, or advanced GIS.
- Requires a **development build** (not Expo Go); configure `MAPBOX_DOWNLOADS_TOKEN` and native prebuild.
- **Do not** embed Mapbox **secret** tokens in the app; use **public** style URLs / download token for CI only.

## Platform ownership

- Listing coordinates and search filters are validated and applied on **`apps/web`** (`listings` queries), not in the client beyond UX.
