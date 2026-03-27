/**
 * Typography tokens — pair with Tailwind: font-semibold tracking-tight, etc.
 */
export const typography = {
  heroTitle: "text-3xl sm:text-4xl font-bold tracking-tight leading-tight",
  sectionTitle: "text-xl sm:text-2xl font-semibold tracking-tight text-white",
  cardTitle: "text-base font-semibold text-white",
  body: "text-sm leading-relaxed text-[#A1A1A1]",
  bodyMuted: "text-xs text-[#A1A1A1]",
  scoreDisplay: "text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-white",
  labelUpper: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]",
} as const;
