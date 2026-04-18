/** Layout schema for black/gold luxury real-estate landing sections. */
export const luxuryBlackGoldTemplate = {
  id: "luxury_black_gold",
  name: "Black / gold luxury",
  layout: ["hero", "value_props", "proof", "cta", "footer_minimal"] as const,
  zones: {
    hero: { title: "h1", subtitle: "p", ctaPrimary: "button", ctaSecondary: "button" },
    value_props: { bullets: "list[3]" },
    proof: { trust_badges: "list" },
    cta: { label: "button" },
  },
  ctaPlacement: "hero_primary" as const,
} as const;
