export const investorFocusedTemplate = {
  id: "investor_focused",
  name: "Investor-focused",
  layout: ["hero_metric", "assumptions", "cta"] as const,
  zones: {
    hero_metric: { title: "h1", kpi_hint: "p" },
    assumptions: { bullets: "list[4]" },
    cta: { label: "button" },
  },
  ctaPlacement: "after_assumptions" as const,
} as const;
