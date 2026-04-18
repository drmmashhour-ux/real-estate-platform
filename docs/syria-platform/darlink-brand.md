# Darlink / دارلينك — Brand Specification

## Identity

- English name: **Darlink**
- Arabic name: **دارلينك**
- Internal key / theme namespace: `darlink`
- Product lane: Syria-first consumer marketplace (buy, long-term rent, short stays where enabled)

## Positioning

- Trustworthy, premium-simple, **Arabic-first**
- English as a mirrored secondary experience (layout and readability, not an afterthought)
- Clear fees and honest manual / admin-reviewed payment posture where applicable
- No blending with LECIPM investor or black/gold marketing identity

## Design System

**Palette (Darlink only)**

| Role | Hex |
|------|-----|
| Deep navy | `#0F172A` |
| Warm sand | `#D6C3A1` |
| Soft off-white | `#F8F6F2` |
| Accent green | `#1F7A5C` |

**Icon idea:** House silhouette merged with a map pin; optional arch or doorway as a secondary motif. Modern geometric, calm surfaces; strong app icon and favicon; avoid noisy stock-real-estate clichés.

**CSS / tokens:** All UI variables use the `darlink` namespace (e.g. `--darlink-*`). No LECIPM theme imports.

## Typography

- Arabic primary: **Cairo**
- English primary: **Inter**
- Optional marketing headline fallback: **Manrope** (Cairo + Inter remain default for UI body)

## Product Phases

1. Consumer shell, RTL/LTR, buy / rent / stays taxonomy  
2. Account surfaces and saved behaviour  
3. Seller/host onboarding and listings (admin review as required)  
4. Transaction and payout layers (explicit, non-misleading; no unsafe automation)  
5. Growth and SEO expansion  

## UI Build Order

1. Brand specification (this document)  
2. Theme tokens and `darlink` CSS variables  
3. Brand asset contract (paths; binaries ship separately)  
4. i18n and RTL/LTR foundation  
5. App shell (header, footer, locale toggle, mobile nav)  
6. Design-system primitives  
7. Home and discovery  
8. Search surfaces (buy, rent, stays)  
9. Listing card and detail  
10. Account  
11. Sell / host entry  
12. Payment placeholders (honest copy only)  
13. SEO / share metadata  
14. Guardrails, tests, documentation  

## Architecture Separation Rules

- Darlink lives in **`apps/syria`** with its own layout, theme, and UX  
- Do **not** import LECIPM marketing layout, dashboard chrome, or black/gold tokens  
- Monorepo sharing is limited to brand-agnostic utilities where truly neutral  
- **`apps/web`** may consume Syria data **read-only** for intelligence / preview; **no cross-app writes**, **no cross-app execution** of Syria marketplace actions  
- Syria execution and operational flows remain **inside `apps/syria`**  

## Reserved Names

*Not for active UI unless promoted via this specification.*

- Darban (داربان)  
- BaytPin (بيت-بن)  
- SouqDar (سوق دار)  
