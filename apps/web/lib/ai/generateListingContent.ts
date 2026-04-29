import "server-only";

export function generateListingContent(listing: Record<string, unknown>): {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
} {
  const city = String(listing.city ?? "Property");
  return {
    title: `${city} listing`,
    subtitle: "Marketing copy stub",
    description: `Stub description generated for listing in ${city}. Replace with templated NLP.`,
    features: ["Open layout", "City access", "Move-in ready"],
  };
}
