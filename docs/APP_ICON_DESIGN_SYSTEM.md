# LECIPM — App icon design system (App Store / Play Store)

Premium, minimal, recognizable launcher icon for **LECIPM Manager** (Expo / EAS). No full wordmark on the icon.

## Master spec

| Token | Value |
|--------|--------|
| Canvas | **1024 × 1024 px**, square, PNG |
| Background | **#000000** (pure black) |
| Primary mark | **#D4AF37** (LECIPM gold) |
| Mark | **Stylized “L”** — geometric, centered, high contrast |
| Typography on icon | **None** — do not use “LECIPM” or long text |
| Detail level | **Low** — reads at ~20 pt on device |

## Optional AI accent

- **Subtle** radial or soft glow only (low opacity).
- Suggested hues: **indigo `#6366F1`** or **violet `#7C3AED`** at **≤ 12%** peak opacity, blurred, **behind** the gold mark (never competing with the L).

## Android adaptive icon

- **Foreground:** `assets/adaptive-icon.png` (1024 × 1024 source; important content in **center ~66%** “safe” circle).
- **Background:** `app.config.ts` → `android.adaptiveIcon.backgroundColor`: **`#000000`**.
- Foreground PNG may use transparent corners; Expo composites over the solid background.

## iOS

- **App Store marketing:** 1024 × 1024 PNG (same as master).
- Xcode / EAS: additional sizes are derived during **prebuild** / **EAS Build** from `./assets/icon.png`.
- Optional: run `pnpm run app-icon:export` in `apps/mobile` for **AppIcon.appiconset** (`icon-exports/ios/`), classic **mipmap** PNGs (`icon-exports/android/`), and reference **adaptive foreground** scales (`icon-exports/android-adaptive-foreground/`). That folder is gitignored; regenerate when you need native-studio handoff.

## Files in repo

| File | Role |
|------|------|
| `apps/mobile/assets/icon.png` | Master 1024 — primary store / Expo `icon` |
| `apps/mobile/assets/adaptive-icon.png` | Android adaptive **foreground** |
| `apps/mobile/assets/splash.png` | Splash (may echo same L; no wordmark required) |
| `apps/mobile/assets/notification-icon.png` | Android notification glyph (simple **L** on transparent) |

## Do not

- Spell out **LECIPM** on the launcher icon.
- Use rainbow or busy gradients.
- Add fine patterns that disappear at small size.

## Regenerate from spec

```bash
cd apps/mobile && pnpm run assets:generate
```

Optional platform buckets:

```bash
cd apps/mobile && pnpm run app-icon:export
```

Replace generated PNGs with a final vector export from design tools if you need pixel-perfect curves; keep the same geometry and colors above.
