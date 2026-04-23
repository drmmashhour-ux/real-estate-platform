# Mobile branding assets

Production launcher and splash live here. Regenerate after changing `scripts/generate-store-assets.mjs`.

**Files (required by `app.config.ts`):**

- `icon.png` — **1024×1024** master (abstract gold mark on black, ~17% safe padding; no text).
- `adaptive-icon.png` — Android adaptive foreground (~18% inset for masks).
- `splash.png` — **1024×1024** (safe-centered stack). `#000000`, subtle radial gold glow, icon (no text), **LECIPM** (serif, gold), one-line slogan: *Find the right property faster, with confidence*.
- `notification-icon.png` — White glyph on transparent (Android notifications).

**Marketing / review exports** (also written by the same script):

- `icon-exports/icon-1024.png` (copy of master)
- `icon-exports/icon-512.png`
- `icon-exports/icon-192.png`
- `icon-exports/icon-180.png`

`app.config.ts` requires the four root assets. After clone:

```bash
cd apps/mobile && pnpm run assets:generate
```

Uses devDependency `sharp`. Optional Xcode/Android mipmap reference: `pnpm run app-icon:export`.

**Store screenshots (ASO):** `pnpm run store-screenshots:generate` → `assets/store-screenshots/iphone-1290x2796/` and `android-1080x1920/` (5 PNGs each: hero, search, trust, speed, AI). Replace with real UI captures when ready.

**Onboarding art (optional):** `assets/onboarding/screen-*.png` — copy from `apps/web` public marketing screenshots or regenerate; used by **`/onboarding`** (`src/app/onboarding.tsx`, Expo Router).

Copy and keywords for the stores: **`STORE_LISTING_DRAFT.md`**.

Before store submission, follow **`docs/STORE-RELEASE-AND-SCALE.md`** (EAS build, secrets, review checklist).
