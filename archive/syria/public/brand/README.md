# Darlink brand assets (`/public/brand`)

## Vector lockups

| File | Use |
|------|-----|
| `darlink-logo.svg` | Default horizontal lockup (transparent background, navy ink). |
| `darlink-logo-light.svg` | Light panel / marketing on colored backgrounds (white card). |
| `darlink-logo-dark.svg` | Full navy tile + light ink (social cards, emails). |

## Icon (no text)

| File | Use |
|------|-----|
| `darlink-icon.svg` | Source vector for app icon / favicon generation. |
| `darlink-icon.png` | 512×512 raster. |
| `darlink-icon-192.png` | PWA / apple-touch base size. |
| `darlink-icon-48.png` | Dense UI / manifest. |
| `darlink-favicon.ico` | Browser tab (multi-size). |
| `favicon-16.png`, `favicon-32.png` | Legacy PNG favicons. |
| `apple-touch-icon.png` | 180×180 iOS home screen. |

## Social / SEO

| File | Use |
|------|-----|
| `darlink-og.svg` | Source for Open Graph art (1200×630). |
| `og-default.png` | Default `openGraph` / Twitter image in `src/lib/seo/darlink-metadata.ts`. |

## Regenerating rasters

From `apps/syria`:

```bash
pnpm run brand:rasters
```

Requires devDependencies `sharp` and `png-to-ico` (see `package.json`).

In the app shell, prefer the inline **`<DarlinkWordmark />`** component so Arabic uses **Cairo** and English **Inter** from `next/font` (see `src/components/brand/DarlinkWordmark.tsx`).
