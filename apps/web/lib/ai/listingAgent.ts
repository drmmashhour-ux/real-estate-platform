/** Loose input: works with CRM / marketplace listing JSON from the client. */
export type ListingAgentInput = {
  title?: string | null;
  description?: string | null;
  images?: unknown[] | null;
  price?: number | null;
};

export function analyzeListing(listing: ListingAgentInput) {
  const issues: string[] = [];
  const actions: string[] = [];

  if (!listing.title || listing.title.length < 20) {
    issues.push("Weak title");
    actions.push("Generate stronger SEO title");
  }

  if (!listing.description || listing.description.length < 300) {
    issues.push("Weak description");
    actions.push("Generate richer property description");
  }

  if (!listing.images || listing.images.length < 6) {
    issues.push("Not enough photos");
    actions.push("Request more listing photos");
  }

  if (!listing.price) {
    issues.push("Missing price");
    actions.push("Run pricing engine");
  }

  return {
    score: Math.max(0, 100 - issues.length * 20),
    issues,
    actions,
  };
}
