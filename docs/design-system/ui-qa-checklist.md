# LECIPM UI QA checklist

Use before shipping dashboard, Senior Living Hub, or admin surfaces.

## Layout & rhythm

- [ ] Spacing follows the 8px-based scale (4–64px) — no one-off `13px` pockets.
- [ ] Headings align to a clear vertical grid; no “floaty” blocks.
- [ ] One clear primary action per view (or per card, if the view is a list of cards).
- [ ] Whitespace is generous; nothing feels cramped. Senior pages have *more* air, not less.

## Components

- [ ] Buttons use the shared `Button` variants (no ad-hoc `bg-yellow-500` primary buttons).
- [ ] Cards use `Card` or dashboard widget shells — consistent padding (20–24px on desktop).
- [ ] Status is shown with `Badge` (or domain pill), not raw strings in body text.
- [ ] Forms: labels visible, focus ring visible (gold or dark), errors short and scannable.
- [ ] Tables: row height comfortable; optional sticky header; actions right-aligned.
- [ ] Empty states use `EmptyState` (or domain empty) with one CTA, not a dead end.
- [ ] Loading: `Skeleton` / list placeholders — no blank white flash.

## Readability (5-second test)

- [ ] A new user can name the page purpose and the next step in under 5 seconds.
- [ ] Body text is at least 15–16px on dashboards; 18px minimum on senior-facing flows.
- [ ] Line length and line height are comfortable (no dense multi-paragraph walls in CTAs).

## Visual noise

- [ ] Gold is used for emphasis, not as a page wash.
- [ ] Chart / KPI count is appropriate: residence = calmer, management = comparison, admin = control center (not a trading terminal).
- [ ] No mixed icon families (stick to one set, e.g. Lucide, 20–24px default).

## Trust & compliance (contextual)

- [ ] Critical actions have clear copy; legal / OACIQ responsibility where required.
- [ ] Onboarding or first-run: max 4–5 steps, one focus at a time, skippable.

## Motion

- [ ] Transitions are ~150–300ms, ease-out; no bouncy overshoot.
- [ ] `prefers-reduced-motion` respected for non-essential animation.

## Regressions

- [ ] No new one-off hex for the same role (use `design-system` tokens or `globals` @theme).
- [ ] Internal reference: `/[locale]/[country]/internal/design-system` (dev) or with `DESIGN_SYSTEM_PAGE=1` in production.
