/**
 * Canva template registry for clients. Admin uses private Canva (https://www.canva.com/) separately.
 * Replace REPLACE_WITH_TEMPLATE_LINK with your Canva template link from Share → Template link.
 */

export type CanvaTemplateCategory = "poster" | "social" | "brochure";

export type CanvaTemplate = {
  id: string;
  name: string;
  category: CanvaTemplateCategory;
  previewImage: string;
  canvaTemplateUrl: string;
};

export const canvaTemplates: CanvaTemplate[] = [
  {
    id: "real-estate-poster-1",
    name: "Real Estate Poster",
    category: "poster",
    previewImage: "/templates/real-estate-poster-1.png",
    canvaTemplateUrl: "https://www.canva.com/design/REPLACE_WITH_TEMPLATE_LINK",
  },
  {
    id: "instagram-property-1",
    name: "Instagram Property Post",
    category: "social",
    previewImage: "/templates/instagram-property-1.png",
    canvaTemplateUrl: "https://www.canva.com/design/REPLACE_WITH_TEMPLATE_LINK",
  },
  {
    id: "property-brochure-1",
    name: "Property Brochure",
    category: "brochure",
    previewImage: "/templates/property-brochure-1.png",
    canvaTemplateUrl: "https://www.canva.com/design/REPLACE_WITH_TEMPLATE_LINK",
  },
];

/** Fallback when template link is not yet replaced – open Canva create. */
export const CANVA_CREATE_FALLBACK = "https://www.canva.com/create/posters/";

/** Admin only: open platform owner's private Canva. */
export const CANVA_HOME = "https://www.canva.com/";

export function getCanvaTemplateUrl(template: CanvaTemplate): string {
  if (template.canvaTemplateUrl.includes("REPLACE_WITH_TEMPLATE_LINK")) {
    return CANVA_CREATE_FALLBACK;
  }
  return template.canvaTemplateUrl;
}

export const TEMPLATE_CATEGORIES: { value: CanvaTemplateCategory; label: string }[] = [
  { value: "poster", label: "Poster" },
  { value: "social", label: "Social" },
  { value: "brochure", label: "Brochure" },
];
