# Hub design system (LECIPM premium)

## Tokens

- **Background:** `#0b0b0b` (`components/hub/hub-tokens.ts` — `HUB_BG`).
- **Gold:** `#D4AF37` and `var(--color-premium-gold)` (`HUB_GOLD`, `HUB_GOLD_CSS`) — aligned with `lib/hub/themes.ts` (`LECIPM_PREMIUM_HUB`).

## Layout

- **`HubLayout`** — existing dashboard shell (sidebar, gold hairline, switcher).
- **`HubShell`** — lightweight marketing-style wrapper for `/hub/*` pages (top gold border, black field).

## Components (`components/hub/`)

| Component | Role |
|-----------|------|
| `HubHero` | Title, optional eyebrow “LECIPM Hub Engine”, subtitle, actions. |
| `HubNavTabs` | Underline active tab with gold. |
| `HubSectionCard` | Thin wrapper over `PremiumSectionCard`. |
| `HubStatCard` | Metric tiles (existing). |
| `HubListingCard` | Image + title + meta for search grids. |
| `HubFilterBar` | Border container for filter controls. |
| `HubEmptyState` | Dashed placeholder. |
| `HubDashboardGrid` | Responsive grid for widgets. |
| `HubActionBar` | Top strip for primary actions. |
| `HubBadge` | Gold or muted pill. |
| `HubQuickActions` | Re-exports `HubQuickActionsRow`. |

## Rules

- Prefer **label keys** + `resolveHubLabel` for user-visible strings in new hub surfaces.
- **RTL:** set `dir` from `hubLocaleDirection("ar")` when rendering Arabic-only layouts.
- Do not change BNHub dashboard styling when migrating to shared components — adopt incrementally.
