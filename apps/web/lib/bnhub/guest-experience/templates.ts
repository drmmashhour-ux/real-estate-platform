export function guestFirstName(name: string | null | undefined): string {
  const t = name?.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

export function buildReviewRequestBody(input: {
  guestName: string | null | undefined;
  listingTitle: string;
  nights: number;
}): string {
  const who = guestFirstName(input.guestName);
  const nightsLabel = input.nights === 1 ? "1 night" : `${input.nights} nights`;
  return `Hi ${who}, thank you for staying with us for ${nightsLabel} at “${input.listingTitle}”. We'd love your feedback.`;
}

export function buildReviewReminderBody(input: {
  guestName: string | null | undefined;
  listingTitle: string;
}): string {
  const who = guestFirstName(input.guestName);
  return `Hi ${who}, just a quick reminder to share your experience about “${input.listingTitle}” when you have a moment.`;
}

export function buildRepeatBookingNudgeBody(input: {
  guestName: string | null | undefined;
  listingTitle: string;
  listingUrl: string;
  similarUrls?: { title: string; url: string }[];
}): string {
  const who = guestFirstName(input.guestName);
  let body = `Hi ${who}, we’d be happy to host you again in the future. Here’s your last stay: ${input.listingTitle}\n${input.listingUrl}`;
  if (input.similarUrls && input.similarUrls.length > 0) {
    body += "\n\nYou might also like:";
    for (const s of input.similarUrls.slice(0, 2)) {
      body += `\n• ${s.title}: ${s.url}`;
    }
  }
  return body;
}
