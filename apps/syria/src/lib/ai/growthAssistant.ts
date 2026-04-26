import { buildListingShareMessage } from "@/lib/ai/shareMessage";

/**
 * @deprecated Use `buildListingShareMessage` from `shareMessage.ts`.
 * Kept for imports that still call this name.
 */
export function buildAiGrowthShareText(input: {
  title: string;
  city: string;
  priceLine: string;
  url: string;
  locale: string;
}): string {
  return buildListingShareMessage({
    title: input.title,
    priceLine: input.priceLine,
    url: input.url,
    locale: input.locale,
    city: input.city,
  });
}
