# Brand guidelines — LECIPM / Carrefour Immobilier Prestige

Single design system for **marketing** and **product** (`apps/web`). Code sources of truth:

| Asset | Location |
|--------|----------|
| Brand core | `config/branding.ts` — `BRAND` + platform re-exports |
| Color / spacing / radius | `config/theme.ts` — `COLORS`, `SPACING`, `RADIUS`, `marketingTheme` |
| Typography | `config/typography.ts` — `TYPOGRAPHY` + `marketingType` (Tailwind class bundles) |
| CSS variables | `app/globals.css` — `:root` tokens (`--color-cta`, `--premium-gold`, etc.) |
| Logos (vector) | `public/branding/logo-dark.svg`, `logo-light.svg`, `logo-icon.svg` |
| UI primitives | `components/ui/` — `Button`, `Card`, `Input`, `Badge`, `Modal`, `Section`, `Icon`, `Logo` / `BrandLogo` |

---

## Logo

- **Default (dark UI):** `BrandLogo` with `variant="default"` → `logo-dark.svg` (full wordmark on dark backgrounds).
- **Light backgrounds:** `variant="light"` → `logo-light.svg`.
- **Icon only:** `variant="icon"` → `logo-icon.svg` (nav, favours, tight spaces).
- **Legacy nav:** `Logo` with `variant="nav"` — icon + gold `LECIPM` wordmark (hub headers).

**Do**

- Use SVG assets under `/public/branding/`; scale proportionally (preserve aspect ratio).
- Keep clear space ≥ half the icon height around the mark.

**Don’t**

- Stretch or skew the logo.
- Change the gold (`#C9A646`) to another hue without a design update.
- Place the dark wordmark on busy imagery without a subtle scrim or solid band.

---

## Color

| Role | Hex | Usage |
|------|-----|--------|
| Primary / gold | `#C9A646` | CTAs, key accents, focus rings, logo strokes |
| Primary hover | `#E0B84F` | Hover states (`--color-cta-hover`) |
| Background | `#0B0B0B` | App shell, marketing page background |
| Surface | `#111111` | Cards, panels |
| Surface light | `#1A1A1A` | Elevated rows, inputs |
| Border | `#2A2A2A` | Dividers, input borders (dark mode) |
| Text primary | `#FFFFFF` | Headings, primary copy |
| Text secondary | `#A0A0A0` | Supporting copy (`--color-text-secondary`) |
| Success / warning / error | `#22C55E` / `#F59E0B` / `#EF4444` | Status, badges |

Prefer **CSS variables** in components (`var(--color-cta)`, `var(--color-border)`) so dashboards and marketing stay aligned.

---

## Typography

- **UI & body:** Inter (`--font-sans`), loaded in root layout.
- **Display / marketing headings:** Cormorant Garamond (`font-serif`) via `marketingType` presets.
- **Scale (reference):** see `TYPOGRAPHY.sizes` in `config/typography.ts` (h1–h3, body, small).

**Do** maintain hierarchy: one clear H1 per view, consistent section titles (`marketingType.sectionTitle`).

**Don’t** mix ad-hoc font families outside Inter + the defined serif for display.

---

## Spacing & radius

- **Spacing:** `SPACING` in `config/theme.ts` (`xs`–`xl` as px strings). Tailwind equivalents: `p-1` (4px) through `p-10` (40px) for layout grids.
- **Radius:** `RADIUS` — map to Tailwind `rounded-md` (~10px), `rounded-2xl` (~16px), etc.
- **Sections:** use `SectionWrapper` (`density`) + `AppContainer` for consistent vertical rhythm and max width.

---

## UI components

- **Buttons:** `Button` — variants `primary` (gold), `secondary` (outline on dark), `ghost`, `danger`; sizes `sm` | `md` | `lg`.
- **Cards:** `Card` — include `dark` and `darkGlass` for dashboard / premium marketing surfaces.
- **Inputs:** `Input` — `mode="dark"` (default) vs `light` for rare light sheets.
- **Icons:** `Icon` from `components/ui/Icon.tsx` wrapping **lucide-react** for consistent size and stroke.

---

## Dashboard design language (product shell)

Use the **same** `COLORS` / `:root` variables as marketing — no second palette.

| Rule | How |
|------|-----|
| Dark UI | Background `#0B0B0B`, surfaces `#111111` / `#1A1A1A` (`BRAND` / `COLORS`) |
| Soft shadows | `var(--shadow-card)` / `var(--shadow-card-hover)` on cards and panels |
| Glass / light surfaces | `Card` with `darkGlass`, or utility **`.ds-glass-panel`** |
| Gold for primary actions | `Button` `primary`, `.btn-primary`, or `var(--color-cta)` |
| Minimal borders | `border-white/10` or `var(--color-border)` — avoid heavy chrome |

**Apply to:**

- **Cards:** `Card` variants `dark` | `darkGlass`, or **`.dashboard-stat-card`** / **`.card-premium`**
- **Tables:** wrap in **`.ds-table-wrap`**, use **`<table class="ds-table">`**
- **Forms:** `Input` (`mode="dark"`), or **`.input-premium`** for legacy markup
- **Modals:** `Modal` component (dark panel + backdrop blur)

---

## Do / don’t (quick)

| Do | Don’t |
|----|--------|
| Reuse tokens and UI primitives | Introduce a second palette for “marketing only” |
| Use gold sparingly for actions & focus | Overuse gold for body text blocks |
| Keep dark surfaces soft (`border-white/10`, blur) | Use pure black `#000000` for large fills (prefer `#0B0B0B`) |

---

## Related

- `docs/ENVIRONMENT_SETUP.md` — deployment-facing env vars (not brand, but same repo discipline).
