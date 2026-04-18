/** Prefer `shadow-ds-soft` / `shadow-ds-glow` from @theme; use for inline style fallbacks only. */
export const shadows = {
  soft: "var(--shadow-ds-soft, 0 10px 40px rgb(0 0 0 / 0.45))",
  glow: "var(--shadow-ds-glow, 0 0 40px rgb(212 175 55 / 0.12))",
} as const;
