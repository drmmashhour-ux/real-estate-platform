/**
 * Global UX principles for LECIPM — use with `@/design-system` tokens + `ds-*` Tailwind utilities.
 * Rollout is incremental (`FEATURE_DESIGN_SYSTEM_V1`, `FEATURE_UI_UNIFICATION_V1`, `FEATURE_AI_INSIGHTS_V1`).
 */
export const designPrinciples = {
  consistency: "Same spacing, typography, components, and interaction patterns across hubs.",
  clarity: "Scannable UI — short labels, no dense paragraphs in product surfaces.",
  hierarchy: "Strong headings, one primary CTA per view where possible, data emphasis via type scale + gold accents.",
  premium: "Black + gold palette, generous whitespace, soft shadows (`shadow-ds-soft` / `shadow-ds-glow`), subtle motion (`animate-ds-*`).",
  aiFirst: "Prefer insight panels, next-step recommendations, and confidence labels — never fabricated metrics.",
} as const;

export type DesignPrincipleKey = keyof typeof designPrinciples;
