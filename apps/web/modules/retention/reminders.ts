/**
 * Reminder copy — calm tone, no countdowns or fake scarcity.
 */
import type { RetentionReminderTemplate } from "./types";

export function getStillLookingReminder(cityHint?: string | null): RetentionReminderTemplate {
  const place = cityHint?.trim() ? ` around ${cityHint.trim()}` : "";
  return {
    id: "still_looking",
    title: "Still planning a stay?",
    body: `If you’re still browsing${place}, here are a few stays you might like. There’s no rush — book when it feels right.`,
    logicExplanation:
      "Sent only when the guest had recent search or view activity and has not exceeded weekly retention message limits.",
  };
}

export function getSavedListingReminder(listingTitle: string): RetentionReminderTemplate {
  return {
    id: "saved_listing_available",
    title: "A listing you saved",
    body: `"${listingTitle}" is still on the platform. Availability changes often — you can open the listing to see current dates and price.`,
    logicExplanation:
      "Triggered from an existing saved listing; we do not claim exclusive availability or limited-time pressure.",
  };
}

export function getSimilarStaysReminder(city: string): RetentionReminderTemplate {
  return {
    id: "similar_stays",
    title: "Stays similar to what you viewed",
    body: `Based on stays you recently viewed in ${city}, here are a few others in the same area you can compare.`,
    logicExplanation: "Uses recent listing views and city match only — no fabricated popularity metrics.",
  };
}
