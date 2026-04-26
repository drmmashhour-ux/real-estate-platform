/** Client-safe helpers to build prompts for `POST /api/ai` (listing discovery + booking UX). */

export function buildListingSearchAssistantPrompt(
  userQuestion: string,
  listingsSummary: { id: string; title: string; city: string; price: number }[]
): string {
  const lines = listingsSummary
    .slice(0, 15)
    .map((l) => `- id=${l.id} | ${l.title} | ${l.city} | $${l.price}`)
    .join("\n");

  return `You are a concise real-estate assistant. The user is browsing listings on our site.

User question: ${userQuestion.trim()}

Available listings (pick ids from this list only; do not invent listings):
${lines || "(none loaded)"}

Reply in 3-6 short bullets: best matches (with id), why they fit, and one clarifying question.`;
}

export function buildBookingSuggestionPrompt(listing: {
  title: string;
  city: string;
  price: number;
}): string {
  return `The guest is considering booking "${listing.title}" in ${listing.city} (list price about $${listing.price}).

Suggest a practical check-in and check-out date range for a short exploratory trip (2–4 nights) starting at least 2 weeks from today. Give ISO dates (YYYY-MM-DD), one paragraph rationale, and a polite note that final dates are subject to availability.`;
}
