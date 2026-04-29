/**
 * Visual hints for demo slides — symbolic keys only (no URLs or user data).
 */
export const narrationRegistry = {
  title: { visualKey: "brand_wordmark", label: "Opening title" },
  problem: { visualKey: "marketplace_static_ui", label: "Problem" },
  solution: { visualKey: "autonomous_loop_diagram", label: "Solution" },
  product: { visualKey: "product_surface_collage", label: "Product" },
  technology: { visualKey: "architecture_layers", label: "Technology" },
  advantage: { visualKey: "differentiation_split", label: "Advantage" },
  vision: { visualKey: "north_star_horizon", label: "Vision" },
  pillars: { visualKey: "platform_pillars_strip", label: "Operator pillars" },
} as const;

export type NarrationSlideKey = keyof typeof narrationRegistry;
