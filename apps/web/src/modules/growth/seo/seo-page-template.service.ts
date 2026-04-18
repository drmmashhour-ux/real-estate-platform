/**
 * Structured shell for drafts — copy is filled with real stats only downstream.
 * TODO v3: multilingual templates.
 */
export function buildSeoDraftTemplate(input: {
  city: string;
  pageFamily: string;
  transactionLabel: string;
  propertyTypeLabel?: string | null;
}): {
  title: string;
  metaTitle: string;
  metaDescription: string;
  sections: string[];
} {
  const pt = input.propertyTypeLabel?.trim() || "homes";
  const title = `${pt} for ${input.transactionLabel} in ${input.city}`.slice(0, 500);
  const metaTitle = title.slice(0, 60);
  const metaDescription =
    `Browse ${pt} for ${input.transactionLabel} in ${input.city} on LECIPM — listings updated from real inventory.`.slice(
      0,
      160
    );
  return {
    title,
    metaTitle,
    metaDescription,
    sections: ["intro", "key_stats", "featured_listings", "highlights", "faq", "internal_links"],
  };
}
