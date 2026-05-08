/**
 * AI writer for listing descriptions — stub for deployment.
 */

export type WriterType = "listing_description" | "bio" | "email" | "general";
export type WriterAction = "generate" | "improve" | "translate" | "shorten";

export type ListingContext = {
  title?: string;
  city?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyType?: string;
  features?: string[];
};

export async function generateText(opts: {
  type?: WriterType;
  action?: WriterAction;
  prompt: string;
  context?: ListingContext;
  lang?: string;
}): Promise<{ text: string }> {
  return { text: opts.prompt };
}
