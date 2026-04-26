/**
 * Deterministic share copy for WhatsApp and “copy text” (Arabic + English).
 * No external AI — same spirit as `growthAssistant` but aligned to product one-liner.
 */
export function buildListingShareMessage(input: {
  title: string;
  priceLine: string;
  url: string;
  locale: string;
  city?: string;
}): string {
  const isAr = input.locale.startsWith("ar");
  const title = input.title.trim() || (isAr ? "إعلان" : "Listing");
  const place = input.city?.trim() ?? "";
  if (isAr) {
    const parts = ["شاهد هذا الإعلان على Hadiah Link 🎁", title, input.priceLine.trim()];
    if (place) parts.push(`📍 ${place}`);
    parts.push(input.url.trim());
    return parts.join("\n");
  }
  const parts = [
    "See this listing on Hadiah Link 🎁",
    title,
    `Price: ${input.priceLine.trim()}`,
  ];
  if (place) parts.push(`Location: ${place}`);
  parts.push(input.url.trim());
  return parts.join("\n");
}
