/**
 * Type scale (Part 3) — dashboard 15–16px min; senior 18px min.
 * Weights: 400 / 500 / 600 / 700. Line height: 1.4–1.6.
 */
export const fontSize = {
  display: { min: 36, max: 48 },
  h1: { min: 30, max: 36 },
  h2: { min: 24, max: 28 },
  h3: { min: 20, max: 22 },
  bodyLg: 18,
  body: 16,
  small: 14,
  caption: 12,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.4,
  normal: 1.5,
  relaxed: 1.6,
} as const;

/**
 * Tailwind class strings for app shell (use with `className` on blocks).
 * `body` = dashboard default; `bodySenior` = 18px min for senior hub.
 */
export const type = {
  display: "text-4xl sm:text-5xl font-semibold tracking-tight text-ds-text leading-[1.1]",
  h1: "text-3xl sm:text-4xl font-semibold tracking-tight text-ds-text leading-tight",
  h2: "text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-ds-text leading-snug",
  h3: "text-lg sm:text-xl font-semibold text-ds-text leading-snug",
  body: "text-[15px] sm:text-base leading-relaxed text-ds-text-secondary",
  bodySenior: "text-[18px] leading-[1.55] text-ds-text",
  bodyStrong: "text-[15px] sm:text-base leading-relaxed text-ds-text font-medium",
  label: "text-xs font-semibold uppercase tracking-[0.18em] text-ds-text-secondary",
  kpi: "text-2xl sm:text-3xl font-semibold tabular-nums text-ds-text",
  caption: "text-xs leading-normal text-ds-text-muted",
} as const;
