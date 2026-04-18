export const minimalModernTemplate = {
  id: "minimal_modern",
  name: "Minimal modern",
  layout: ["hero_compact", "feature_row", "cta_inline"] as const,
  zones: {
    hero_compact: { title: "h1", subtitle: "p" },
    feature_row: { items: "list[3]" },
    cta_inline: { label: "button" },
  },
  ctaPlacement: "inline_end" as const,
} as const;
