/**
 * “Friendly OTA” layout — large photo zone, soft corners, primary CTA (text zones only; no assets generated).
 */
export const airbnbStyleTemplate = {
  id: "airbnb_style",
  name: "Airbnb-style listing hero",
  layout: ["hero_photo", "title_row", "spec_chips", "description", "cta_sticky"] as const,
  zones: {
    hero_photo: { aspect: "16:9", overlay: "gradient_bottom" },
    title_row: { title: "h1", subtitle: "p", badge: "optional" },
    spec_chips: { chips: "list[4]" },
    description: { body: "p", read_more: "toggle" },
    cta_sticky: { primary: "button", secondary: "text_link" },
  },
  ctaPlacement: "hero_bottom_sticky" as const,
} as const;
