/**
 * Typography scale — prefer Tailwind utilities on components.
 * Serif headings use `font-[family-name:var(--font-serif)]` from root layout.
 */
export const type = {
  h1: "font-semibold tracking-tight text-ds-text text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] leading-[1.08]",
  h2: "font-semibold tracking-tight text-ds-text text-2xl sm:text-3xl md:text-[2rem] leading-tight",
  h3: "font-semibold text-ds-text text-lg sm:text-xl leading-snug",
  body: "text-sm sm:text-base leading-relaxed text-ds-text-secondary",
  bodyStrong: "text-sm sm:text-base leading-relaxed text-ds-text",
  label: "text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary",
  kpi: "text-2xl sm:text-3xl font-semibold tabular-nums text-ds-text",
} as const;
