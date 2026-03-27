/**
 * Typography system — Inter for UI; display serif comes from root layout (`--font-serif`).
 * Apply via CSS variables on `body` (`globals.css`); use these tokens in TS when needed.
 */
export const TYPOGRAPHY = {
  /** Root layout loads Inter as `--font-sans`; use that in CSS for rendering. */
  heading: "Inter, sans-serif",
  body: "Inter, sans-serif",
  sizes: {
    h1: "48px",
    h2: "36px",
    h3: "28px",
    body: "16px",
    small: "14px",
  },
  weights: {
    bold: 700,
    semibold: 600,
    regular: 400,
  },
} as const;

/** Tailwind class bundles for marketing sections (serif display via `font-serif`). */
export const marketingType = {
  heroEyebrow: "text-xs font-semibold uppercase tracking-[0.2em]",
  heroTitle: "font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl",
  heroSubtitle: "text-lg leading-relaxed text-slate-400 sm:text-xl",
  sectionTitle: "font-serif text-3xl font-semibold tracking-tight sm:text-4xl",
  sectionSubtitle: "mt-3 max-w-2xl text-base text-slate-400 sm:text-lg",
  cardTitle: "text-lg font-semibold text-white",
  cardBody: "text-sm leading-relaxed text-slate-400",
} as const;
